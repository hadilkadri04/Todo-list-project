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
                    def backendOk = bat(
                        returnStatus: true,
                        script: '''
                            @powershell -Command "try {
                                $r = irm http://localhost:8081/api.php -UseBasicParsing -ErrorAction Stop
                                exit ($r.Count -ge 0) ? 0 : 1
                            } catch { exit 1 }"
                        '''
                    ) == 0

                    def frontendOk = bat(
                        returnStatus: true,
                        script: '''
                            @powershell -Command "try {
                                $r = (Invoke-WebRequest http://localhost:8888 -UseBasicParsing).StatusCode
                                exit ($r -eq 200) ? 0 : 1
                            } catch { exit 1 }"
                        '''
                    ) == 0

                    echo "✅ Backend: ${backendOk ? 'PASSED' : 'FAILED'} | Frontend: ${frontendOk ? 'PASSED' : 'FAILED'}"
                    if (!(backendOk && frontendOk)) {
                        error "❌ Smoke test FAILED"
                    }
                    echo "✅ Smoke test PASSED"
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