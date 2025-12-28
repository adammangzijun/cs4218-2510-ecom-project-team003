pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Rebuild & Restart Containers') {
            steps {
                sh '''
                  docker compose down
                  docker compose build
                  docker compose up -d
                '''
            }
        }
    }
}