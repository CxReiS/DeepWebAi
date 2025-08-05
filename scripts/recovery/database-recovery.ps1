# DeepWebAI Database Recovery Script (PowerShell)
# Comprehensive recovery solution for DeepWebAI platform

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$TargetDatabase = "",
    [switch]$CreateDatabase = $false,
    [switch]$ForceRestore = $false,
    [switch]$TestMode = $false,
    [switch]$Verify = $true
)

$ErrorActionPreference = "Stop"
$Date = Get-Date -Format "yyyyMMdd-HHmmss"
$LogFile = "recovery-$Date.log"

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
            Database = $matches[4] -replace '\?.*$', ''
        }
    } else {
        throw "Invalid database URL format"
    }
}

# Validate backup file
function Test-BackupFile {
    param([string]$FilePath)
    
    Write-Log "Validating backup file: $FilePath"
    
    if (-not (Test-Path $FilePath)) {
        throw "Backup file not found: $FilePath"
    }
    
    $Extension = [System.IO.Path]::GetExtension($FilePath).ToLower()
    
    switch ($Extension) {
        ".sql" {
            $Content = Get-Content $FilePath -First 10 -ErrorAction SilentlyContinue
            if ($Content -notmatch "PostgreSQL database dump") {
                throw "Invalid SQL dump file"
            }
        }
        ".gz" {
            if (Get-Command "7z" -ErrorAction SilentlyContinue) {
                $Result = Start-Process -FilePath "7z" -ArgumentList @("t", $FilePath) -Wait -PassThru -NoNewWindow
                if ($Result.ExitCode -ne 0) {
                    throw "Corrupted gzip file"
                }
            } else {
                Write-Log "Cannot verify gzip file: 7z not available" "WARNING"
            }
        }
        ".zip" {
            try {
                Add-Type -AssemblyName System.IO.Compression.FileSystem
                [System.IO.Compression.ZipFile]::OpenRead($FilePath).Dispose()
            } catch {
                throw "Corrupted zip file: $($_.Exception.Message)"
            }
        }
        default {
            Write-Log "Unknown file extension, proceeding anyway" "WARNING"
        }
    }
    
    Write-Log "Backup file validation passed"
}

# Extract compressed backup
function Expand-BackupFile {
    param([string]$FilePath)
    
    $Extension = [System.IO.Path]::GetExtension($FilePath).ToLower()
    
    if ($Extension -eq ".gz") {
        $ExtractedFile = $FilePath -replace '\.gz$', ''
        Write-Log "Extracting gzip file: $FilePath"
        
        if (Get-Command "7z" -ErrorAction SilentlyContinue) {
            Start-Process -FilePath "7z" -ArgumentList @("x", "-y", $FilePath) -Wait -NoNewWindow
        } else {
            throw "7z not available for gzip extraction"
        }
        
        return $ExtractedFile
    } elseif ($Extension -eq ".zip") {
        $ExtractedDir = [System.IO.Path]::GetDirectoryName($FilePath)
        Write-Log "Extracting zip file: $FilePath"
        
        Expand-Archive -Path $FilePath -DestinationPath $ExtractedDir -Force
        
        # Find the SQL file
        $SqlFiles = Get-ChildItem $ExtractedDir -Filter "*.sql"
        if ($SqlFiles.Count -eq 1) {
            return $SqlFiles[0].FullName
        } else {
            throw "Expected exactly one SQL file in zip archive"
        }
    } else {
        return $FilePath
    }
}

# Create database if it doesn't exist
function New-Database {
    param([hashtable]$DbInfo, [string]$DatabaseName)
    
    if (-not $CreateDatabase) {
        return
    }
    
    Write-Log "Creating database: $DatabaseName"
    
    try {
        $env:PGPASSWORD = $DbInfo.Password
        
        # Connect to postgres database to create new database
        $Arguments = @(
            "--host", $DbInfo.Host,
            "--username", $DbInfo.Username,
            "--dbname", "postgres",
            "--command", "CREATE DATABASE `"$DatabaseName`";"
        )
        
        Start-Process -FilePath "psql" -ArgumentList $Arguments -Wait -NoNewWindow
        Write-Log "Database created successfully: $DatabaseName"
        
    } catch {
        Write-Log "Failed to create database: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Drop database connections
function Disconnect-DatabaseUsers {
    param([hashtable]$DbInfo, [string]$DatabaseName)
    
    Write-Log "Terminating active connections to database: $DatabaseName"
    
    try {
        $env:PGPASSWORD = $DbInfo.Password
        
        $Query = @"
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DatabaseName' AND pid <> pg_backend_pid();
"@
        
        $Arguments = @(
            "--host", $DbInfo.Host,
            "--username", $DbInfo.Username,
            "--dbname", "postgres",
            "--command", $Query
        )
        
        Start-Process -FilePath "psql" -ArgumentList $Arguments -Wait -NoNewWindow
        Write-Log "Database connections terminated"
        
    } catch {
        Write-Log "Warning: Could not terminate all connections" "WARNING"
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Create database backup before restore
function Backup-ExistingDatabase {
    param([hashtable]$DbInfo, [string]$DatabaseName)
    
    $PreRestoreBackup = "pre-restore-$DatabaseName-$Date.sql"
    Write-Log "Creating pre-restore backup: $PreRestoreBackup"
    
    try {
        $env:PGPASSWORD = $DbInfo.Password
        
        $Arguments = @(
            "--host", $DbInfo.Host,
            "--username", $DbInfo.Username,
            "--dbname", $DatabaseName,
            "--file", $PreRestoreBackup,
            "--verbose"
        )
        
        Start-Process -FilePath "pg_dump" -ArgumentList $Arguments -Wait -NoNewWindow
        
        if (Test-Path $PreRestoreBackup) {
            Write-Log "Pre-restore backup created: $PreRestoreBackup"
            return $PreRestoreBackup
        }
        
    } catch {
        Write-Log "Failed to create pre-restore backup: $($_.Exception.Message)" "WARNING"
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
    
    return $null
}

# Restore database from backup
function Restore-Database {
    param([hashtable]$DbInfo, [string]$DatabaseName, [string]$BackupFilePath)
    
    Write-Log "Starting database restore..."
    Write-Log "Target database: $DatabaseName"
    Write-Log "Backup file: $BackupFilePath"
    
    if ($TestMode) {
        Write-Log "TEST MODE: Would restore database here" "WARNING"
        return
    }
    
    try {
        $env:PGPASSWORD = $DbInfo.Password
        
        # Disconnect users
        Disconnect-DatabaseUsers -DbInfo $DbInfo -DatabaseName $DatabaseName
        
        $Arguments = @(
            "--host", $DbInfo.Host,
            "--username", $DbInfo.Username,
            "--dbname", $DatabaseName,
            "--verbose",
            "--clean",
            "--if-exists",
            "--file", $BackupFilePath
        )
        
        if ($ForceRestore) {
            $Arguments += "--single-transaction"
        }
        
        Write-Log "Executing restore command..."
        $Process = Start-Process -FilePath "psql" -ArgumentList $Arguments -Wait -PassThru -NoNewWindow
        
        if ($Process.ExitCode -eq 0) {
            Write-Log "Database restore completed successfully"
        } else {
            throw "psql exited with code $($Process.ExitCode)"
        }
        
    } catch {
        Write-Log "Database restore failed: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Verify restored database
function Test-RestoredDatabase {
    param([hashtable]$DbInfo, [string]$DatabaseName)
    
    if (-not $Verify) {
        return $true
    }
    
    Write-Log "Verifying restored database..."
    
    try {
        $env:PGPASSWORD = $DbInfo.Password
        
        # Test basic connectivity
        $Arguments = @(
            "--host", $DbInfo.Host,
            "--username", $DbInfo.Username,
            "--dbname", $DatabaseName,
            "--command", "SELECT COUNT(*) FROM information_schema.tables WHERE table_type = 'BASE TABLE';"
        )
        
        $Result = Start-Process -FilePath "psql" -ArgumentList $Arguments -Wait -PassThru -NoNewWindow
        
        if ($Result.ExitCode -ne 0) {
            throw "Database connectivity test failed"
        }
        
        # Test specific tables
        $RequiredTables = @("users", "conversations", "files")
        foreach ($Table in $RequiredTables) {
            $Arguments = @(
                "--host", $DbInfo.Host,
                "--username", $DbInfo.Username,
                "--dbname", $DatabaseName,
                "--command", "SELECT COUNT(*) FROM $Table LIMIT 1;"
            )
            
            $Result = Start-Process -FilePath "psql" -ArgumentList $Arguments -Wait -PassThru -NoNewWindow
            
            if ($Result.ExitCode -ne 0) {
                Write-Log "Warning: Table $Table may not exist or be accessible" "WARNING"
            }
        }
        
        Write-Log "Database verification completed successfully"
        return $true
        
    } catch {
        Write-Log "Database verification failed: $($_.Exception.Message)" "ERROR"
        return $false
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Generate recovery report
function New-RecoveryReport {
    param([string]$BackupFile, [string]$TargetDb, [bool]$Success, [string]$PreRestoreBackup)
    
    $Report = @{
        Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        BackupFile = $BackupFile
        TargetDatabase = $TargetDb
        Success = $Success
        TestMode = $TestMode.IsPresent
        PreRestoreBackup = $PreRestoreBackup
        Environment = $env:ENVIRONMENT ?? "unknown"
    }
    
    $ReportFile = "recovery-report-$Date.json"
    $Report | ConvertTo-Json | Set-Content $ReportFile
    
    Write-Log "Recovery report saved: $ReportFile"
}

# Main execution
function Main {
    Write-Log "=== DeepWebAI Database Recovery Started ==="
    Write-Log "Backup File: $BackupFile"
    Write-Log "Target Database: $TargetDatabase"
    Write-Log "Create Database: $CreateDatabase"
    Write-Log "Force Restore: $ForceRestore"
    Write-Log "Test Mode: $TestMode"
    
    try {
        # Parse database configuration
        $DbInfo = Parse-DatabaseUrl -Url $DatabaseUrl
        $DatabaseName = if ($TargetDatabase) { $TargetDatabase } else { $DbInfo.Database }
        
        # Validate backup file
        Test-BackupFile -FilePath $BackupFile
        
        # Extract if compressed
        $SqlFile = Expand-BackupFile -FilePath $BackupFile
        
        # Create database if needed
        if ($CreateDatabase) {
            New-Database -DbInfo $DbInfo -DatabaseName $DatabaseName
        }
        
        # Create pre-restore backup
        $PreRestoreBackup = $null
        if (-not $TestMode) {
            $PreRestoreBackup = Backup-ExistingDatabase -DbInfo $DbInfo -DatabaseName $DatabaseName
        }
        
        # Restore database
        Restore-Database -DbInfo $DbInfo -DatabaseName $DatabaseName -BackupFilePath $SqlFile
        
        # Verify restoration
        $IsValid = Test-RestoredDatabase -DbInfo $DbInfo -DatabaseName $DatabaseName
        
        if (-not $IsValid) {
            throw "Database verification failed after restore"
        }
        
        # Clean up extracted files
        if ($SqlFile -ne $BackupFile -and (Test-Path $SqlFile)) {
            Remove-Item $SqlFile -Force
        }
        
        # Generate report
        New-RecoveryReport -BackupFile $BackupFile -TargetDb $DatabaseName -Success $true -PreRestoreBackup $PreRestoreBackup
        
        Write-Log "=== Recovery completed successfully ==="
        return 0
        
    } catch {
        Write-Log "=== Recovery failed: $($_.Exception.Message) ===" "ERROR"
        New-RecoveryReport -BackupFile $BackupFile -TargetDb $DatabaseName -Success $false -PreRestoreBackup $null
        return 1
    }
}

# Execute main function
exit (Main)
