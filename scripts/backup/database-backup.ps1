# DeepWebAI Database Backup Script (PowerShell)
# Comprehensive backup solution for Neon PostgreSQL database

param(
    [string]$BackupPath = ".\backups",
    [string]$RetentionDays = "7",
    [switch]$Compress = $true,
    [switch]$Verify = $true,
    [switch]$Upload = $false,
    [string]$S3Bucket = ""
)

# Configuration
$ErrorActionPreference = "Stop"
$LogFile = Join-Path $BackupPath "backup-$(Get-Date -Format 'yyyyMMdd').log"
$Date = Get-Date -Format "yyyyMMdd-HHmmss"

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

$DatabaseUrl = $env:DATABASE_URL
if (-not $DatabaseUrl) {
    Write-Error "DATABASE_URL environment variable not set"
    exit 1
}

# Create backup directory
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
    Write-Host "Created backup directory: $BackupPath"
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $LogEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Parse database URL
function Parse-DatabaseUrl {
    param([string]$Url)
    
    if ($Url -match "postgresql://([^:]+):([^@]+)@([^/]+)/(.+)") {
        return @{
            Username = $matches[1]
            Password = $matches[2]
            Host = $matches[3]
            Database = $matches[4]
        }
    } else {
        throw "Invalid database URL format"
    }
}

# Create full database backup
function Backup-Database {
    Write-Log "Starting database backup..."
    
    try {
        $DbInfo = Parse-DatabaseUrl -Url $DatabaseUrl
        $BackupFile = Join-Path $BackupPath "deepwebai-full-$Date.sql"
        
        # Set PostgreSQL password
        $env:PGPASSWORD = $DbInfo.Password
        
        # Create backup
        $Arguments = @(
            "--host", $DbInfo.Host,
            "--username", $DbInfo.Username,
            "--dbname", $DbInfo.Database,
            "--verbose",
            "--clean",
            "--no-owner",
            "--no-privileges",
            "--file", $BackupFile
        )
        
        Write-Log "Creating backup: $BackupFile"
        Start-Process -FilePath "pg_dump" -ArgumentList $Arguments -Wait -NoNewWindow
        
        if (Test-Path $BackupFile) {
            $Size = (Get-Item $BackupFile).Length / 1MB
            Write-Log "Backup created successfully: $BackupFile ($([math]::Round($Size, 2)) MB)"
            
            # Compress if requested
            if ($Compress) {
                $CompressedFile = "$BackupFile.gz"
                Write-Log "Compressing backup..."
                
                # Use 7-Zip if available, otherwise use PowerShell compression
                if (Get-Command "7z" -ErrorAction SilentlyContinue) {
                    Start-Process -FilePath "7z" -ArgumentList @("a", "-tgzip", $CompressedFile, $BackupFile) -Wait -NoNewWindow
                } else {
                    Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip"
                    $CompressedFile = "$BackupFile.zip"
                }
                
                Remove-Item $BackupFile
                $CompressedSize = (Get-Item $CompressedFile).Length / 1MB
                Write-Log "Backup compressed: $CompressedFile ($([math]::Round($CompressedSize, 2)) MB)"
                $BackupFile = $CompressedFile
            }
            
            return $BackupFile
        } else {
            throw "Backup file was not created"
        }
    } catch {
        Write-Log "Database backup failed: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Create schema-only backup
function Backup-Schema {
    Write-Log "Starting schema backup..."
    
    try {
        $DbInfo = Parse-DatabaseUrl -Url $DatabaseUrl
        $SchemaFile = Join-Path $BackupPath "deepwebai-schema-$Date.sql"
        
        $env:PGPASSWORD = $DbInfo.Password
        
        $Arguments = @(
            "--host", $DbInfo.Host,
            "--username", $DbInfo.Username,
            "--dbname", $DbInfo.Database,
            "--schema-only",
            "--verbose",
            "--clean",
            "--no-owner",
            "--no-privileges",
            "--file", $SchemaFile
        )
        
        Start-Process -FilePath "pg_dump" -ArgumentList $Arguments -Wait -NoNewWindow
        
        if (Test-Path $SchemaFile) {
            Write-Log "Schema backup created: $SchemaFile"
            return $SchemaFile
        }
    } catch {
        Write-Log "Schema backup failed: $($_.Exception.Message)" "ERROR"
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Backup specific tables
function Backup-Tables {
    param([string[]]$Tables = @("users", "conversations", "files", "feature_flags"))
    
    Write-Log "Starting table-specific backups..."
    
    try {
        $DbInfo = Parse-DatabaseUrl -Url $DatabaseUrl
        $env:PGPASSWORD = $DbInfo.Password
        
        foreach ($Table in $Tables) {
            $TableFile = Join-Path $BackupPath "deepwebai-$Table-$Date.sql"
            
            $Arguments = @(
                "--host", $DbInfo.Host,
                "--username", $DbInfo.Username,
                "--dbname", $DbInfo.Database,
                "--table", $Table,
                "--data-only",
                "--column-inserts",
                "--file", $TableFile
            )
            
            Start-Process -FilePath "pg_dump" -ArgumentList $Arguments -Wait -NoNewWindow
            
            if (Test-Path $TableFile) {
                Write-Log "Table backup created: $Table -> $TableFile"
            }
        }
    } catch {
        Write-Log "Table backup failed: $($_.Exception.Message)" "ERROR"
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Verify backup integrity
function Test-Backup {
    param([string]$BackupFile)
    
    if (-not $Verify) { return $true }
    
    Write-Log "Verifying backup integrity..."
    
    try {
        # For compressed files, test the archive
        if ($BackupFile -match "\.(gz|zip)$") {
            if ($BackupFile -match "\.gz$" -and (Get-Command "7z" -ErrorAction SilentlyContinue)) {
                $Result = Start-Process -FilePath "7z" -ArgumentList @("t", $BackupFile) -Wait -PassThru -NoNewWindow
                return $Result.ExitCode -eq 0
            } elseif ($BackupFile -match "\.zip$") {
                try {
                    Add-Type -AssemblyName System.IO.Compression.FileSystem
                    [System.IO.Compression.ZipFile]::OpenRead($BackupFile).Dispose()
                    return $true
                } catch {
                    return $false
                }
            }
        } else {
            # For SQL files, check if it's readable and contains expected content
            $Content = Get-Content $BackupFile -First 10
            return $Content -match "PostgreSQL database dump"
        }
        
        Write-Log "Backup verification completed successfully"
        return $true
    } catch {
        Write-Log "Backup verification failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Upload to cloud storage
function Upload-Backup {
    param([string]$BackupFile)
    
    if (-not $Upload -or -not $S3Bucket) { return }
    
    Write-Log "Uploading backup to S3..."
    
    try {
        $FileName = Split-Path $BackupFile -Leaf
        $S3Key = "database-backups/$Date/$FileName"
        
        if (Get-Command "aws" -ErrorAction SilentlyContinue) {
            Start-Process -FilePath "aws" -ArgumentList @("s3", "cp", $BackupFile, "s3://$S3Bucket/$S3Key") -Wait -NoNewWindow
            Write-Log "Backup uploaded to s3://$S3Bucket/$S3Key"
        } else {
            Write-Log "AWS CLI not found, skipping upload" "WARNING"
        }
    } catch {
        Write-Log "Upload failed: $($_.Exception.Message)" "ERROR"
    }
}

# Clean old backups
function Remove-OldBackups {
    Write-Log "Cleaning old backups (retention: $RetentionDays days)..."
    
    try {
        $CutoffDate = (Get-Date).AddDays(-[int]$RetentionDays)
        $OldBackups = Get-ChildItem $BackupPath -Filter "deepwebai-*" | Where-Object { $_.LastWriteTime -lt $CutoffDate }
        
        foreach ($Backup in $OldBackups) {
            Remove-Item $Backup.FullName -Force
            Write-Log "Removed old backup: $($Backup.Name)"
        }
        
        Write-Log "Cleanup completed"
    } catch {
        Write-Log "Cleanup failed: $($_.Exception.Message)" "ERROR"
    }
}

# Generate backup report
function New-BackupReport {
    param([string]$BackupFile, [bool]$Success)
    
    $Report = @{
        Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        BackupFile = $BackupFile
        Success = $Success
        Size = if (Test-Path $BackupFile) { (Get-Item $BackupFile).Length } else { 0 }
        Environment = $env:ENVIRONMENT ?? "unknown"
    }
    
    $ReportFile = Join-Path $BackupPath "backup-report-$Date.json"
    $Report | ConvertTo-Json | Set-Content $ReportFile
    
    Write-Log "Backup report saved: $ReportFile"
}

# Main execution
function Main {
    Write-Log "=== DeepWebAI Database Backup Started ==="
    Write-Log "Backup Path: $BackupPath"
    Write-Log "Retention: $RetentionDays days"
    Write-Log "Compress: $Compress"
    Write-Log "Verify: $Verify"
    
    try {
        # Create full backup
        $BackupFile = Backup-Database
        
        # Create schema backup
        Backup-Schema
        
        # Create table backups
        Backup-Tables
        
        # Verify backup
        $IsValid = Test-Backup -BackupFile $BackupFile
        if (-not $IsValid) {
            throw "Backup verification failed"
        }
        
        # Upload to cloud
        Upload-Backup -BackupFile $BackupFile
        
        # Clean old backups
        Remove-OldBackups
        
        # Generate report
        New-BackupReport -BackupFile $BackupFile -Success $true
        
        Write-Log "=== Backup completed successfully ==="
        return 0
        
    } catch {
        Write-Log "=== Backup failed: $($_.Exception.Message) ===" "ERROR"
        New-BackupReport -BackupFile "" -Success $false
        return 1
    }
}

# Execute main function
exit (Main)
