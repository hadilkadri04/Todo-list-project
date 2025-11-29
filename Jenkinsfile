// Jenkinsfile - Todo List DevOps Project
// Bulletproof version for Windows Jenkins - Zero errors guaranteed

pipeline {
    agent any

    environment {
        BUILD_TAG = "build-${BUILD_NUMBER}"
        BACKEND_PORT = "8081"
        FRONTEND_PORT = "8888"
    }

    stages {
        stage('Start') {
            steps {
                script {
                    if (env.CHANGE_ID) {
                        echo "🚀 PIPELINE 1: Build & Smoke sur PR #${env.CHANGE_ID}"
                        currentBuild.description = "PR Pipeline #${env.CHANGE_ID}"
                    } else if (env.TAG_NAME) {
                        echo "📦 PIPELINE 3: Build versionné (tag ${env.TAG_NAME})"
                        currentBuild.description = "Versioned Build ${env.TAG_NAME}"
                    } else {
                        echo "✅ PIPELINE 2: Build complet sur push (branche ${env.BRANCH_NAME ?: 'dev'})"
                        currentBuild.description = "Full Build - ${env.BRANCH_NAME}"
                    }
                }
            }
        }

        stage('1. Checkout') {
            steps {
                checkout scm
                script {
                    try {
                        def commit = bat(
                            returnStdout: true,
                            script: '@git rev-parse --short HEAD 2>nul'
                        ).trim()
                        echo "✅ Checked out commit: ${commit}"
                    } catch (Exception e) {
                        echo "✅ Checkout complete"
                    }
                }
            }
        }

        stage('2. Setup') {
            steps {
                echo "🔧 Setting up environment..."
                bat '''
                    @echo off
                    echo [Setup] Killing processes on port 8081...
                    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING 2^>nul') do (
                        taskkill /F /PID %%a >nul 2>&1
                    )
                    
                    echo [Setup] Killing processes on port 8888...
                    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8888 ^| findstr LISTENING 2^>nul') do (
                        taskkill /F /PID %%a >nul 2>&1
                    )
                    
                    echo [Setup] Stopping Docker containers...
                    docker-compose down -v --remove-orphans >nul 2>&1
                    
                    echo [Setup] Pruning Docker volumes...
                    docker volume prune -f >nul 2>&1
                    
                    echo [Setup] Creating reports directory...
                    if not exist reports mkdir reports
                    
                    echo [Setup] Complete
                    exit /b 0
                '''
                echo "✅ Setup complete"
            }
        }

        stage('3. Build') {
            parallel {
                stage('Backend') {
                    steps {
                        echo "🏗️ Building backend image..."
                        bat """
                            @echo off
                            docker build -t todolist-backend:${env.BUILD_TAG} ./backend
                            if errorlevel 1 exit /b 1
                            echo Backend image built successfully
                        """
                        echo "✅ Backend built"
                    }
                }
                stage('Frontend') {
                    steps {
                        echo "🏗️ Building frontend image..."
                        bat """
                            @echo off
                            docker build -t todolist-frontend:${env.BUILD_TAG} ./frontend
                            if errorlevel 1 exit /b 1
                            echo Frontend image built successfully
                        """
                        echo "✅ Frontend built"
                    }
                }
            }
        }

        stage('4. Run') {
            steps {
                echo "🚀 Starting Docker containers..."
                bat """
                    @echo off
                    docker-compose up -d --build
                    if errorlevel 1 (
                        echo Failed to start containers
                        exit /b 1
                    )
                    echo Containers started successfully
                """
                
                echo "⏳ Waiting 60 seconds for services to initialize..."
                sleep time: 60, unit: 'SECONDS'
                
                bat '''
                    @echo off
                    echo.
                    echo === Container Status ===
                    docker ps --filter name=todolist- --format "{{.Names}} - {{.Status}}"
                    echo.
                    exit /b 0
                '''
                
                echo "✅ Services are running"
            }
        }

        stage('5. Smoke Test') {
            steps {
                script {
                    echo "🧪 Starting smoke tests..."
                    
                    def backendOk = false
                    def frontendOk = false
                    def crudOk = false
                    
                    // Test 1: Backend API
                    echo "Testing backend API..."
                    for (int i = 1; i <= 10; i++) {
                        echo "Backend test attempt ${i}/10..."
                        
                        def status = bat(
                            returnStatus: true,
                            script: '''
                                @echo off
                                powershell -NoProfile -ExecutionPolicy Bypass -Command ^
                                "try { ^
                                    $response = Invoke-RestMethod 'http://localhost:8081/api.php' -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop; ^
                                    Write-Host 'Backend responded with' $response.Count 'tasks'; ^
                                    exit 0 ^
                                } catch { ^
                                    Write-Host 'Backend error:' $_.Exception.Message; ^
                                    exit 1 ^
                                }"
                            '''
                        )
                        
                        if (status == 0) {
                            backendOk = true
                            echo "✅ Backend test PASSED"
                            break
                        }
                        
                        if (i < 10) {
                            echo "Waiting 5 seconds before retry..."
                            sleep time: 5, unit: 'SECONDS'
                        }
                    }
                    
                    // Test 2: Frontend
                    echo "Testing frontend..."
                    def frontendStatus = bat(
                        returnStatus: true,
                        script: '''
                            @echo off
                            powershell -NoProfile -ExecutionPolicy Bypass -Command ^
                            "try { ^
                                $response = Invoke-WebRequest 'http://localhost:8888' -UseBasicParsing -TimeoutSec 10; ^
                                if ($response.StatusCode -eq 200) { ^
                                    Write-Host 'Frontend returned HTTP' $response.StatusCode; ^
                                    exit 0 ^
                                } else { ^
                                    exit 1 ^
                                } ^
                            } catch { ^
                                Write-Host 'Frontend error:' $_.Exception.Message; ^
                                exit 1 ^
                            }"
                        '''
                    )
                    
                    frontendOk = (frontendStatus == 0)
                    if (frontendOk) {
                        echo "✅ Frontend test PASSED"
                    } else {
                        echo "❌ Frontend test FAILED"
                    }
                    
                    // Test 3: CRUD Operations
                    if (backendOk) {
                        echo "Testing CRUD operations..."
                        def crudStatus = bat(
                            returnStatus: true,
                            script: '''
                                @echo off
                                powershell -NoProfile -ExecutionPolicy Bypass -Command ^
                                "try { ^
                                    $body = @{title='[Jenkins CI Test]'} | ConvertTo-Json; ^
                                    $response = Invoke-RestMethod 'http://localhost:8081/api.php' -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 10; ^
                                    if ($response.status -eq 'created') { ^
                                        Write-Host 'CRUD test: Task created successfully'; ^
                                        exit 0 ^
                                    } else { ^
                                        Write-Host 'CRUD test: Unexpected response'; ^
                                        exit 1 ^
                                    } ^
                                } catch { ^
                                    Write-Host 'CRUD error:' $_.Exception.Message; ^
                                    exit 1 ^
                                }"
                            '''
                        )
                        
                        crudOk = (crudStatus == 0)
                        if (crudOk) {
                            echo "✅ CRUD test PASSED"
                        } else {
                            echo "❌ CRUD test FAILED"
                        }
                    } else {
                        echo "⚠️ Skipping CRUD test (backend unavailable)"
                    }
                    
                    // Results summary
                    echo ""
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo "📊 SMOKE TEST RESULTS:"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo "Backend API:  ${backendOk ? '✅ PASSED' : '❌ FAILED'}"
                    echo "Frontend UI:  ${frontendOk ? '✅ PASSED' : '❌ FAILED'}"
                    echo "CRUD POST:    ${crudOk ? '✅ PASSED' : '❌ FAILED'}"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo ""
                    
                    // Save results to file
                    bat """
                        @echo off
                        echo Backend: ${backendOk ? 'PASSED' : 'FAILED'} > reports\\smoke-result.txt
                        echo Frontend: ${frontendOk ? 'PASSED' : 'FAILED'} >> reports\\smoke-result.txt
                        echo CRUD: ${crudOk ? 'PASSED' : 'FAILED'} >> reports\\smoke-result.txt
                        exit /b 0
                    """
                    
                    // Show logs if backend failed
                    if (!backendOk) {
                        echo "📋 Displaying backend logs for debugging..."
                        bat '''
                            @echo off
                            echo.
                            echo === BACKEND LOGS ===
                            docker logs todolist-backend 2>&1 | findstr /I "error warning ready listening"
                            echo.
                            echo === DATABASE LOGS ===
                            docker logs todolist-db 2>&1 | findstr /I "error warning ready connections"
                            echo.
                            exit /b 0
                        '''
                    }
                    
                    // Determine final result
                    if (!backendOk || !frontendOk || !crudOk) {
                        currentBuild.result = 'FAILURE'
                        error "❌ Smoke tests failed - see results above"
                    }
                    
                    echo "🎉 All smoke tests PASSED!"
                }
            }
        }

        stage('6. Archive') {
            when {
                expression { currentBuild.result != 'FAILURE' }
            }
            steps {
                echo "📦 Archiving artifacts..."
                bat """
                    @echo off
                    echo Collecting container logs...
                    docker logs todolist-db > reports\\db.log 2>&1
                    docker logs todolist-backend > reports\\backend.log 2>&1
                    docker logs todolist-frontend > reports\\frontend.log 2>&1
                    
                    echo Creating build info...
                    echo Build Number: ${env.BUILD_NUMBER} > reports\\build-info.txt
                    echo Build Tag: ${env.BUILD_TAG} >> reports\\build-info.txt
                    echo Branch: ${env.BRANCH_NAME ?: 'unknown'} >> reports\\build-info.txt
                    echo Date: %date% %time% >> reports\\build-info.txt
                    
                    echo Artifacts prepared
                    exit /b 0
                """
                
                archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true, fingerprint: true
                
                script {
                    if (env.TAG_NAME) {
                        echo "Creating release artifacts for tag ${env.TAG_NAME}..."
                        bat """
                            @echo off
                            if not exist release mkdir release
                            
                            echo Saving Docker images...
                            docker save todolist-backend:${env.BUILD_TAG} -o release\\backend-${env.TAG_NAME}.tar
                            docker save todolist-frontend:${env.BUILD_TAG} -o release\\frontend-${env.TAG_NAME}.tar
                            
                            echo Creating release notes...
                            echo Version: ${env.TAG_NAME} > release\\RELEASE.txt
                            echo Build: ${env.BUILD_NUMBER} >> release\\RELEASE.txt
                            echo Date: %date% %time% >> release\\RELEASE.txt
                            
                            echo Release package created
                            exit /b 0
                        """
                        
                        archiveArtifacts artifacts: 'release/**', allowEmptyArchive: true, fingerprint: true
                        echo "📦 Release artifacts archived"
                    }
                }
                
                echo "✅ All artifacts archived successfully"
            }
        }

        stage('7. Cleanup') {
            steps {
                echo "🧹 Cleaning up Docker containers..."
                bat '''
                    @echo off
                    docker-compose down -v --remove-orphans >nul 2>&1
                    echo Cleanup complete
                    exit /b 0
                '''
                echo "✅ Cleanup complete"
            }
        }
    }

    post {
        success {
            script {
                echo ""
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "🎉 PIPELINE COMPLETED SUCCESSFULLY!"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "Build: #${env.BUILD_NUMBER}"
                echo "Tag: ${env.BUILD_TAG}"
                echo "All smoke tests passed!"
                echo "Artifacts have been archived."
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo ""
            }
        }
        
        failure {
            script {
                echo ""
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "❌ PIPELINE FAILED"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "Build: #${env.BUILD_NUMBER}"
                echo "Check the console output and archived logs for details."
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo ""
                
                bat """
                    @echo off
                    if not exist reports mkdir reports
                    
                    echo Collecting failure logs...
                    echo PIPELINE FAILED > reports\\smoke-result.txt
                    echo Build: ${env.BUILD_NUMBER} >> reports\\smoke-result.txt
                    
                    docker logs todolist-backend > reports\\backend-failure.log 2>&1
                    docker logs todolist-db > reports\\db-failure.log 2>&1
                    docker logs todolist-frontend > reports\\frontend-failure.log 2>&1
                    
                    echo Failure logs collected
                    exit /b 0
                """
                
                archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true, fingerprint: true
            }
        }
        
        always {
            script {
                echo "🧹 Final cleanup..."
                bat '''
                    @echo off
                    docker-compose down -v --remove-orphans >nul 2>&1
                    exit /b 0
                '''
                echo "✅ All resources cleaned up"
            }
        }
    }
}