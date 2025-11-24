"use client";

import { Box, Container, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const GradientBackground = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(2),
}));

const AuthCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  borderRadius: theme.spacing(3),
  backdropFilter: "blur(20px)",
  background: "rgba(255, 255, 255, 0.95)",
  boxShadow: "0 32px 64px rgba(0, 0, 0, 0.15)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  position: "relative",
  overflow: "hidden",
  maxWidth: 480,
  width: "100%",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginBottom: theme.spacing(3), // réduit l’espace sous le titre
}));

const LogoIcon = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  borderRadius: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(2),
  boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
  color: "white",
}));

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GradientBackground>
      <Container maxWidth="sm">
        <AuthCard elevation={0}>
          <LogoContainer>
            <LogoIcon>
              <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </LogoIcon>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                color: "#1a202c", 
                mb: 1 
              }}
            >
              CRM Comptable
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              Gestion automatisée pour cabinets comptables
            </Typography>
          </LogoContainer>
          {children}
        </AuthCard>
      </Container>
    </GradientBackground>
  );
}
