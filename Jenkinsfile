// Jenkinsfile — ISG Sousse DevOps Project
// Fixed: Proper PowerShell execution + 3 distinct pipelines

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
                    def commit = bat(
                        returnStdout: true,
                        script: '@git rev-parse --short HEAD 2>nul || echo UNKNOWN'
                    ).trim()
                    echo "✅ Checked out commit: ${commit}"
                }
            }
        }

        stage('2. Setup') {
            steps {
                echo "🔧 Ensuring ports 8081, 8888 are free..."
                bat '''
                    @echo off
                    echo • Releasing port 8081 (backend)...
                    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING') do (
                        echo   Killing PID %%a
                        taskkill /F /PID %%a 2>nul
                    )
                    echo • Releasing port 8888 (frontend)...
                    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8888 ^| findstr LISTENING') do (
                        echo   Killing PID %%a
                        taskkill /F /PID %%a 2>nul
                    )
                    echo • Removing leftover containers...
                    docker ps -aq --filter name=todolist- > temp.txt 2>nul
                    for /f %%i in (temp.txt) do docker rm -f %%i 2>nul
                    del temp.txt 2>nul
                    docker volume prune -f 2>nul
                '''
                echo "✅ Setup complete"
            }
        }

        stage('3. Build') {
            parallel {
                stage('Backend') {
                    steps {
                        echo "🏗️ Building backend (PHP + MySQL)..."
                        bat "docker build -t todolist-backend:${env.BUILD_TAG} ./backend"
                    }
                }
                stage('Frontend') {
                    steps {
                        echo "🏗️ Building frontend (Nginx)..."
                        bat "docker build -t todolist-frontend:${env.BUILD_TAG} ./frontend"
                    }
                }
            }
        }

        stage('4. Run (Docker Compose)') {
            steps {
                echo "🚀 Starting services with docker-compose..."
                bat "docker-compose up -d --build"
                echo "⏳ Waiting 30 seconds for MySQL + backend to initialize..."
                sleep time: 30, unit: 'SECONDS'
                echo "✅ Services started"
            }
        }

        stage('5. Smoke Test') {
            steps {
                script {
                    echo "🧪 Running smoke tests..."

                    // Test 1: Backend API (GET) - Retry up to 6 times
                    def backendOk = false
                    for (int i = 1; i <= 6 && !backendOk; i++) {
                        echo "🔍 Testing backend API (attempt ${i}/6)..."
                        def status = bat(
                            returnStatus: true,
                            script: '''
                                @echo off
                                powershell -NoProfile -Command "try { $r = Invoke-RestMethod 'http://localhost:8081/api.php' -UseBasicParsing -ErrorAction Stop; if ($r.Count -ge 0) { exit 0 } else { exit 1 } } catch { exit 1 }"
                            '''
                        )
                        backendOk = (status == 0)
                        if (!backendOk && i < 6) {
                            echo "⏳ Backend not ready yet..."
                            sleep time: 5, unit: 'SECONDS'
                        }
                    }

                    // Test 2: Frontend UI (HTTP 200)
                    echo "🔍 Testing frontend UI..."
                    def frontendOk = bat(
                        returnStatus: true,
                        script: '''
                            @echo off
                            powershell -NoProfile -Command "try { $r = (Invoke-WebRequest 'http://localhost:8888' -UseBasicParsing).StatusCode; if ($r -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
                        '''
                    ) == 0

                    // Test 3: CRUD (POST)
                    def crudOk = false
                    if (backendOk) {
                        echo "🔍 Testing CRUD operations (POST)..."
                        def status = bat(
                            returnStatus: true,
                            script: '''
                                @echo off
                                powershell -NoProfile -Command "try { $body = @{title='[CI] Smoke Test'} | ConvertTo-Json; $resp = Invoke-RestMethod 'http://localhost:8081/api.php' -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing; if ($resp.status -eq 'created') { exit 0 } else { exit 1 } } catch { exit 1 }"
                            '''
                        )
                        crudOk = (status == 0)
                    }

                    // Display results
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo "📊 SMOKE TEST RESULTS:"
                    echo "   Backend API:  ${backendOk ? '✅ PASSED' : '❌ FAILED'}"
                    echo "   Frontend UI:  ${frontendOk ? '✅ PASSED' : '❌ FAILED'}"
                    echo "   CRUD POST:    ${crudOk ? '✅ PASSED' : '❌ FAILED'}"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

                    if (!(backendOk && frontendOk && crudOk)) {
                        currentBuild.result = 'FAILURE'
                        error "❌ Smoke test FAILED - See results above"
                    }
                    echo "🎉 All smoke tests PASSED!"
                }
            }
        }

        stage('6. Archive Artifacts') {
            when {
                expression { currentBuild.result != 'FAILURE' }
            }
            steps {
                script {
                    echo "📦 Archiving artifacts..."
                    bat '''
                        @echo off
                        if not exist reports mkdir reports
                        docker logs todolist-db > reports/db.log 2>&1
                        docker logs todolist-backend > reports/backend.log 2>&1
                        docker logs todolist-frontend > reports/frontend.log 2>&1
                        
                        echo Build Number: %BUILD_NUMBER% > reports/build-info.txt
                        echo Build Tag: %BUILD_TAG% >> reports/build-info.txt
                        echo Branch: %BRANCH_NAME% >> reports/build-info.txt
                        echo Timestamp: %DATE% %TIME% >> reports/build-info.txt
                        
                        echo PASSED > reports/smoke-result.txt
                        echo Backend: PASSED >> reports/smoke-result.txt
                        echo Frontend: PASSED >> reports/smoke-result.txt
                        echo CRUD: PASSED >> reports/smoke-result.txt
                    '''
                    
                    // Archive artifacts with fingerprinting
                    archiveArtifacts artifacts: 'reports/**', fingerprint: true, allowEmptyArchive: true
                    
                    // For versioned builds (Pipeline 3), create release artifacts
                    if (env.TAG_NAME) {
                        bat """
                            @echo off
                            if not exist release mkdir release
                            echo Creating release archive for ${env.TAG_NAME}...
                            docker save todolist-backend:${env.BUILD_TAG} -o release/backend-${env.TAG_NAME}.tar
                            docker save todolist-frontend:${env.BUILD_TAG} -o release/frontend-${env.TAG_NAME}.tar
                        """
                        archiveArtifacts artifacts: 'release/**', fingerprint: true
                        echo "📦 Release artifacts created for ${env.TAG_NAME}"
                    }
                    
                    echo "✅ Artifacts archived successfully"
                }
            }
        }

        stage('7. Cleanup') {
            steps {
                echo "🧹 Cleaning up containers and volumes..."
                bat '''
                    @echo off
                    docker-compose down -v --remove-orphans 2>nul
                    echo Cleanup complete
                '''
                echo "✅ Cleanup done"
            }
        }
    }

    post {
        success {
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🎉 PIPELINE SUCCESSFUL"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        }
        failure {
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "❌ PIPELINE FAILED"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            bat '''
                @echo off
                if not exist reports mkdir reports
                echo FAILED > reports/smoke-result.txt
                docker-compose logs > reports/failure-logs.txt 2>&1
            '''
            archiveArtifacts artifacts: 'reports/**', fingerprint: true, allowEmptyArchive: true
        }
        always {
            echo "🧹 Final cleanup..."
            bat 'docker-compose down -v --remove-orphans 2>nul || exit 0'
        }
    }
}