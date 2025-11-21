// jenkins/Jenkinsfile

pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Setup') {
            steps {
                echo 'Setup environment...'
                sh 'echo "Environment ready"'
            }
        }
        stage('Build') {
            parallel { // Exécution parallèle des builds
                stage('Build Backend') {
                    steps {
                        // Utiliser le numéro de build pour nommer l'image
                        sh 'docker build -f backend/Dockerfile.backend -t todo-backend:${env.BUILD_NUMBER} .'
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh 'docker build -f frontend/Dockerfile.frontend -t todo-frontend:${env.BUILD_NUMBER} .'
                    }
                }
            }
        }
        stage('Run') {
            steps {
                // Lancer les conteneurs avec des noms uniques basés sur le build
                sh 'docker run -d --name todo-backend-container-${env.BUILD_NUMBER} -p 8080:80 todo-backend:${env.BUILD_NUMBER}'
                sh 'sleep 10' // Attendre que le conteneur démarre
                sh 'docker run -d --name todo-frontend-container-${env.BUILD_NUMBER} -p 8081:80 todo-frontend:${env.BUILD_NUMBER}'
                sh 'sleep 10'
            }
        }
        stage('Smoke Test') {
            steps {
                sh '''
                    echo "Running smoke tests..."

                    # Tester le backend
                    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/)
                    if [ $BACKEND_STATUS -eq 200 ]; then
                      echo "✅ Backend OK (Status: $BACKEND_STATUS)"
                    else
                      echo "❌ Backend KO (Status: $BACKEND_STATUS)"
                      exit 1
                    fi

                    # Tester le frontend
                    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/)
                    if [ $FRONTEND_STATUS -eq 200 ]; then
                      echo "✅ Frontend OK (Status: $FRONTEND_STATUS)"
                    else
                      echo "❌ Frontend KO (Status: $FRONTEND_STATUS)"
                      exit 1
                    fi

                    echo "All smoke tests passed!"
                '''
            }
        }
        stage('Archive Artifacts') {
            steps {
                // Archiver des logs ou rapports de test
                sh 'mkdir -p logs && echo "Build logs for build ${env.BUILD_NUMBER}" > logs/build-${env.BUILD_NUMBER}.log'
                archiveArtifacts artifacts: 'logs/**', fingerprint: true
            }
        }
    }
    post {
        always {
            // S'assurer que les conteneurs sont arrêtés et supprimés après le pipeline
            sh 'docker stop todo-backend-container-${env.BUILD_NUMBER} || true'
            sh 'docker stop todo-frontend-container-${env.BUILD_NUMBER} || true'
            sh 'docker rm todo-backend-container-${env.BUILD_NUMBER} || true'
            sh 'docker rm todo-frontend-container-${env.BUILD_NUMBER} || true'
        }
    }
}
