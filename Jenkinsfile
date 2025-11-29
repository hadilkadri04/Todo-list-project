pipeline {
    agent any

    // Définition des triggers (Déclencheurs)
    triggers {
        // Vérifie les changements toutes les minutes (si pas de webhook configuré)
        pollSCM('* * * * *')
    }

    stages {
        // STAGE 1 : Checkout
        stage('Checkout') {
            steps {
                echo "📝 Récupération du code..."
                checkout scm
            }
        }

        // STAGE 2 : Setup
        stage('Setup') {
            steps {
                script {
                    echo "🧹 Nettoyage de l'environnement..."
                    // On s'assure que rien ne tourne avant de commencer
                    bat 'docker-compose down -v --remove-orphans'
                }
            }
        }

        // STAGE 3 : Build (Avec Parallélisation comme demandé)
        stage('Build') {
            failFast true
            parallel {
                stage('Build Backend') {
                    steps {
                        echo "🏗️ Construction de l'image Backend..."
                        bat 'docker-compose build backend'
                    }
                }
                stage('Build Frontend') {
                    steps {
                        echo "🏗️ Construction de l'image Frontend..."
                        bat 'docker-compose build frontend'
                    }
                }
            }
        }

        // STAGE 4 : Run (Docker)
        stage('Run (Docker)') {
            steps {
                script {
                    echo "🚀 Démarrage des conteneurs..."
                    bat 'docker-compose up -d'
                    echo "⏳ Attente de l'initialisation de la base de données (30s)..."
                    sleep 30
                }
            }
        }

        // STAGE 5 : Smoke Test
        stage('Smoke Test') {
            steps {
                script {
                    echo "🧪 Lancement des Smoke Tests..."
                    
                    // Test Backend (Port 8085)
                    writeFile file: 'test_backend.ps1', text: '''
                        try {
                            $r = Invoke-WebRequest -Uri "http://localhost:8085" -Method Head -TimeoutSec 5 -ErrorAction Stop
                            if ($r.StatusCode -eq 200) { Write-Host "✅ Backend UP"; exit 0 }
                            else { exit 1 }
                        } catch { exit 1 }
                    '''
                    
                    // Test Frontend (Port 8090)
                    writeFile file: 'test_frontend.ps1', text: '''
                        try {
                            $r = Invoke-WebRequest -Uri "http://localhost:8090" -Method Head -TimeoutSec 5 -ErrorAction Stop
                            if ($r.StatusCode -eq 200) { Write-Host "✅ Frontend UP"; exit 0 }
                            else { exit 1 }
                        } catch { exit 1 }
                    '''

                    // Exécution parallèle des tests
                    parallel {
                        stage('Test Back') { steps { bat 'powershell -ExecutionPolicy Bypass -File test_backend.ps1' } }
                        stage('Test Front') { steps { bat 'powershell -ExecutionPolicy Bypass -File test_frontend.ps1' } }
                    }
                }
            }
        }

        // STAGE 6 : Archive Artifacts (Logique conditionnelle selon le PDF)
        stage('Archive Artifacts') {
            steps {
                script {
                    // Création d'un rapport factice pour l'exemple
                    writeFile file: 'pipeline_report.txt', text: "Rapport du Build ${env.BUILD_NUMBER}\nBranche: ${env.BRANCH_NAME}\nStatut: SUCCÈS"
                    
                    // Cas 1 : Build Versionné (Tag vX.Y.Z)
                    if (env.TAG_NAME ==~ /v.*/) {
                        echo "📦 Archivage complet pour la Release ${env.TAG_NAME}"
                        // Ici on archiverait les binaires, on simule avec le rapport
                        archiveArtifacts artifacts: 'pipeline_report.txt', fingerprint: true
                    }
                    // Cas 2 : Branche Dev (Push standard)
                    else if (env.BRANCH_NAME == 'dev') {
                        echo "📄 Archivage des logs pour Dev"
                        archiveArtifacts artifacts: 'pipeline_report.txt'
                    }
                    // Cas 3 : Pull Request
                    else if (env.CHANGE_ID) {
                        echo "🔍 Archivage léger pour la Pull Request"
                        archiveArtifacts artifacts: 'pipeline_report.txt'
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo "🏁 Cleanup final..."
                bat 'docker-compose down -v'
                
                // Génération du statut pour le prof
                echo "Statut du Pipeline : ${currentBuild.currentResult}"
            }
        }
    }
}