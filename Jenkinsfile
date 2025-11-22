// Jenkinsfile — ISG Sousse DevOps Project
// ✅ Fixed for Windows Jenkins (no timeout, no syntax errors)
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
                        echo "🚀 Pipeline 1: Build & Smoke sur PR #${env.CHANGE_ID}"
                    } else if (env.TAG_NAME) {
                        echo "📦 Pipeline 3: Build versionné (tag ${env.TAG_NAME})"
                    } else {
                        echo "✅ Pipeline 2: Build complet sur push (branche ${env.BRANCH_NAME ?: 'unknown'})"
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
                        script: 'git rev-parse --short HEAD 2>nul || echo UNKNOWN'
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
                    docker rm -f $(docker ps -aq --filter name=todolist-) 2>nul
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
                // ✅ FIXED: Use Jenkins-native sleep (no shell, no timeout)
                sleep time: 30, unit: 'SECONDS'
                echo "✅ Services started"
            }
        }

       stage('5. Smoke Test') {
    steps {
        script {
            echo "🧪 Running smoke tests..."

            // Test 1: Backend API (GET)
            def backendOk = false
            for (int i = 0; i < 6 && !backendOk; i++) {
                def status = bat(
                    returnStatus: true,
                    script: '''
                        @powershell -Command "try {
                            $r = Invoke-RestMethod 'http://localhost:8081/api.php' -UseBasicParsing -ErrorAction Stop
                            if ($r.Count -ge 0) { exit 0 } else { exit 1 }
                        } catch { exit 1 }"
                    '''
                )
                backendOk = (status == 0)
                if (!backendOk && i < 5) {
                    echo "⏳ Backend not ready (attempt ${i+1}/6)..."
                    sleep time: 5, unit: 'SECONDS'
                }
            }

            // Test 2: Frontend UI (HTTP 200)
            def frontendOk = bat(
                returnStatus: true,
                script: '''
                    @powershell -Command "try {
                        $r = (Invoke-WebRequest 'http://localhost:8888' -UseBasicParsing).StatusCode
                        if ($r -eq 200) { exit 0 } else { exit 1 }
                    } catch { exit 1 }"
                '''
            ) == 0

            // Test 3: CRUD (POST)
            def crudOk = false
            if (backendOk) {
                def status = bat(
                    returnStatus: true,
                    script: '''
                        @powershell -Command "try {
                            $body = @{title='[CI] Smoke Test'} | ConvertTo-Json
                            $resp = Invoke-RestMethod 'http://localhost:8081/api.php' -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing
                            if ($resp.status -eq 'created') { exit 0 } else { exit 1 }
                        } catch { exit 1 }"
                    '''
                )
                crudOk = (status == 0)
            }

            echo "✅ Backend: ${backendOk ? 'PASSED' : 'FAILED'}"
            echo "✅ Frontend: ${frontendOk ? 'PASSED' : 'FAILED'}"
            echo "✅ CRUD: ${crudOk ? 'PASSED' : 'FAILED'}"

            if (!(backendOk && frontendOk && crudOk)) {
                currentBuild.result = 'FAILURE'
                error "❌ Smoke test FAILED"
            }
            echo "🎉 All smoke tests PASSED"
        }
    }
}

        stage('6. Archive Artifacts') {
            steps {
                bat '''
                    @echo off
                    mkdir reports 2>nul
                    docker logs todolist-db > reports/db.log 2>nul
                    docker logs todolist-backend > reports/backend.log 2>nul
                    echo Build %BUILD_NUMBER% > reports/build-info.txt
                    echo Passed > reports/smoke-result.txt
                '''
                archiveArtifacts artifacts: 'reports/**', fingerprint: true
                echo "📦 Artifacts archived"
            }
        }
    }

    post {
        always {
            echo "🧹 Cleanup: stopping containers..."
            bat 'docker-compose down -v --remove-orphans 2>nul'
            echo "✅ Pipeline finished (${currentBuild.result ?: 'SUCCESS'})"
        }
    }
}