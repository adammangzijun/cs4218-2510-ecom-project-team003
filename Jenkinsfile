pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
                sh 'docker version'
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