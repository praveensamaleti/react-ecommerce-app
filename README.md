# React E-commerce App

A modern, responsive e-commerce frontend built with React, TypeScript, and Zustand for state management. This application is containerized with Docker and ready for automated deployment to AWS ECS via GitHub Actions.

## 🚀 Features

- **Product Catalog**: Browse and filter products by category, search, and price range.
- **Shopping Cart**: Fully functional cart with persistent storage and automatic total recomputation.
- **Authentication**: User login and registration flows (currently with mock backend).
- **Responsive UI**: Built with React Bootstrap and Lucide icons for a clean, modern look.
- **Containerized**: Nginx-based Docker image for high performance and reliability.
- **CI/CD**: Automated deployment to AWS ECR and ECS using GitHub Actions.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Zustand (State Management)
- **Styling**: Bootstrap 5 (via React Bootstrap), CSS Modules
- **Icons**: Lucide React
- **Containerization**: Docker, Nginx
- **Deployment**: AWS ECS (Fargate), AWS ECR, GitHub Actions

## 💻 Getting Started

### Prerequisites

- Node.js 18+
- Docker (optional, for containerized local testing)

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

### Docker Local Testing

1. **Build and run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```
   The production-optimized container will be available at [http://localhost:80](http://localhost:80).

## 🚢 Deployment to AWS

This project is pre-configured for automated deployment to **AWS ECS (Fargate)**.

### GitHub Actions Setup

To enable automated deployments, add the following secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID`: Your AWS IAM user access key.
- `AWS_SECRET_ACCESS_KEY`: Your AWS IAM user secret key.

### AWS Infrastructure Requirements

The [deploy.yml](.github/workflows/deploy.yml) workflow expects the following resources in the `ap-southeast-2` region:

1. **Amazon ECR**: A repository named `react-ecommerce-app`.
2. **Amazon ECS Cluster**: A cluster named `react-ecommerce-app`.
3. **Amazon ECS Service**: A service named `react-ecommerce-service`.
4. **CloudWatch Logs**: A log group named `/ecs/react-ecommerce-app`.

Refer to [task-definition.json](task-definition.json) for the container configuration details.

## 📄 License

This project is open-source and available under the MIT License.
