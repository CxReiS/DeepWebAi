#!/bin/bash
# DeepWebAI Database Backup Script (Unix/Linux)
# Comprehensive backup solution for Neon PostgreSQL database

set -euo pipefail

# Configuration
BACKUP_PATH="${BACKUP_PATH:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
COMPRESS="${COMPRESS:-true}"
VERIFY="${VERIFY:-true}"
UPLOAD="${UPLOAD:-false}"
S3_BUCKET="${S3_BUCKET:-}"
DATE=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="$BACKUP_PATH/backup-$(date +%Y%m%d).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables if .env exists
if [[ -f .env ]]; then
    set -a
    source .env
    set +a
fi

# Check required environment variables
if [[ -z "${DATABASE_URL:-}" ]]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable not set${NC}"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Logging function
log() {
    local level="${2:-INFO}"
    local message="$(date '+%Y-%m-%d %H:%M:%S') [$level] $1"
    echo -e "$message"
    echo "$message" >> "$LOG_FILE"
}

log_error() { log "$1" "ERROR"; }
log_warn() { log "$1" "WARNING"; }
log_info() { log "$1" "INFO"; }

# Parse database URL
parse_db_url() {
    local url="$1"
    if [[ $url =~ postgresql://([^:]+):([^@]+)@([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_NAME="${BASH_REMATCH[4]}"
        # Remove query parameters
        DB_NAME="${DB_NAME%%\?*}"
    else
        log_error "Invalid database URL format"
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    local deps=("pg_dump" "psql")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "Required dependency not found: $dep"
            echo "Please install PostgreSQL client tools"
            exit 1
        fi
    done
    
    if [[ "$COMPRESS" == "true" ]] && ! command -v gzip &> /dev/null; then
        log_warn "gzip not found, compression disabled"
        COMPRESS="false"
    fi
    
    if [[ "$UPLOAD" == "true" ]] && ! command -v aws &> /dev/null; then
        log_warn "AWS CLI not found, upload disabled"
        UPLOAD="false"
    fi
}

# Create full database backup
backup_database() {
    log_info "Starting database backup..."
    
    local backup_file="$BACKUP_PATH/deepwebai-full-$DATE.sql"
    
    export PGPASSWORD="$DB_PASS"
    
    pg_dump \
        --host="$DB_HOST" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --no-owner \
        --no-privileges \
        --file="$backup_file" \
        2>> "$LOG_FILE"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file was not created"
        return 1
    fi
    
    local size=$(du -h "$backup_file" | cut -f1)
    log_info "Backup created successfully: $backup_file ($size)"
    
    # Compress if requested
    if [[ "$COMPRESS" == "true" ]]; then
        log_info "Compressing backup..."
        gzip "$backup_file"
        backup_file="$backup_file.gz"
        local compressed_size=$(du -h "$backup_file" | cut -f1)
        log_info "Backup compressed: $backup_file ($compressed_size)"
    fi
    
    echo "$backup_file"
}

# Create schema-only backup
backup_schema() {
    log_info "Starting schema backup..."
    
    local schema_file="$BACKUP_PATH/deepwebai-schema-$DATE.sql"
    
    export PGPASSWORD="$DB_PASS"
    
    pg_dump \
        --host="$DB_HOST" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --schema-only \
        --verbose \
        --clean \
        --no-owner \
        --no-privileges \
        --file="$schema_file" \
        2>> "$LOG_FILE" || true
    
    if [[ -f "$schema_file" ]]; then
        log_info "Schema backup created: $schema_file"
    fi
}

# Backup specific tables
backup_tables() {
    local tables=("users" "conversations" "files" "feature_flags" "user_preferences")
    
    log_info "Starting table-specific backups..."
    
    export PGPASSWORD="$DB_PASS"
    
    for table in "${tables[@]}"; do
        local table_file="$BACKUP_PATH/deepwebai-$table-$DATE.sql"
        
        pg_dump \
            --host="$DB_HOST" \
            --username="$DB_USER" \
            --dbname="$DB_NAME" \
            --table="$table" \
            --data-only \
            --column-inserts \
            --file="$table_file" \
            2>> "$LOG_FILE" || true
        
        if [[ -f "$table_file" ]]; then
            log_info "Table backup created: $table -> $table_file"
        fi
    done
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    if [[ "$VERIFY" != "true" ]]; then
        return 0
    fi
    
    log_info "Verifying backup integrity..."
    
    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file" 2>/dev/null; then
            log_info "Backup verification completed successfully"
            return 0
        else
            log_error "Backup verification failed: corrupt gzip file"
            return 1
        fi
    else
        if head -n 10 "$backup_file" | grep -q "PostgreSQL database dump"; then
            log_info "Backup verification completed successfully"
            return 0
        else
            log_error "Backup verification failed: invalid SQL dump"
            return 1
        fi
    fi
}

# Upload to cloud storage
upload_backup() {
    local backup_file="$1"
    
    if [[ "$UPLOAD" != "true" || -z "$S3_BUCKET" ]]; then
        return 0
    fi
    
    log_info "Uploading backup to S3..."
    
    local filename=$(basename "$backup_file")
    local s3_key="database-backups/$DATE/$filename"
    
    if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$s3_key" 2>> "$LOG_FILE"; then
        log_info "Backup uploaded to s3://$S3_BUCKET/$s3_key"
    else
        log_error "Upload failed"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning old backups (retention: $RETENTION_DAYS days)..."
    
    # Remove files older than retention period
    find "$BACKUP_PATH" -name "deepwebai-*" -type f -mtime +$RETENTION_DAYS -delete 2>> "$LOG_FILE" || true
    
    # Remove empty directories
    find "$BACKUP_PATH" -type d -empty -delete 2>/dev/null || true
    
    log_info "Cleanup completed"
}

# Generate backup report
generate_report() {
    local backup_file="$1"
    local success="$2"
    
    local report_file="$BACKUP_PATH/backup-report-$DATE.json"
    
    cat > "$report_file" <<EOF
{
    "date": "$(date -Iseconds)",
    "backup_file": "$backup_file",
    "success": $success,
    "size": $(stat -c%s "$backup_file" 2>/dev/null || echo 0),
    "environment": "${ENVIRONMENT:-unknown}",
    "retention_days": $RETENTION_DAYS,
    "compressed": $COMPRESS,
    "verified": $VERIFY,
    "uploaded": $UPLOAD
}
EOF
    
    log_info "Backup report saved: $report_file"
}

# Test database connection
test_connection() {
    log_info "Testing database connection..."
    
    export PGPASSWORD="$DB_PASS"
    
    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        log_info "Database connection successful"
        return 0
    else
        log_error "Database connection failed"
        return 1
    fi
}

# Main execution
main() {
    log_info "=== DeepWebAI Database Backup Started ==="
    log_info "Backup Path: $BACKUP_PATH"
    log_info "Retention: $RETENTION_DAYS days"
    log_info "Compress: $COMPRESS"
    log_info "Verify: $VERIFY"
    log_info "Upload: $UPLOAD"
    
    # Parse database URL
    parse_db_url "$DATABASE_URL"
    
    # Check dependencies
    check_dependencies
    
    # Test connection
    if ! test_connection; then
        generate_report "" false
        exit 1
    fi
    
    local backup_file
    local success=true
    
    # Create backups
    if backup_file=$(backup_database); then
        # Create additional backups
        backup_schema
        backup_tables
        
        # Verify backup
        if ! verify_backup "$backup_file"; then
            success=false
        fi
        
        # Upload to cloud
        if [[ "$success" == "true" ]]; then
            upload_backup "$backup_file" || success=false
        fi
        
        # Clean old backups
        cleanup_old_backups
        
    else
        backup_file=""
        success=false
    fi
    
    # Generate report
    generate_report "$backup_file" "$success"
    
    # Clean up environment
    unset PGPASSWORD
    
    if [[ "$success" == "true" ]]; then
        log_info "=== Backup completed successfully ==="
        exit 0
    else
        log_error "=== Backup failed ==="
        exit 1
    fi
}

# Handle script termination
cleanup() {
    unset PGPASSWORD 2>/dev/null || true
    log_warn "Backup interrupted"
    exit 1
}

trap cleanup SIGINT SIGTERM

# Execute main function
main "$@"
