"use client";

import { Button, Link, Stack, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import NextLink from "next/link";
import { useActionState } from "react";
import createUser from "./create-user";

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(1.5),
    backgroundColor: "white",
    "& fieldset": {
      borderColor: "#e2e8f0",
      borderWidth: 2,
    },
    "&:hover fieldset": {
      borderColor: "#cbd5e0",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
    },
  },
  "& .MuiInputBase-input": {
    padding: theme.spacing(2, 2.5),
    fontSize: "16px",
  },
  "& .MuiInputLabel-root": {
    fontWeight: 600,
    color: "#2d3748",
    "&.Mui-focused": {
      color: "#667eea",
    },
  },
}));

export default function Signup() {
  const [state, formAction] = useActionState(createUser, { error: "" });

  return (
    <form action={formAction}>
      <Stack
        spacing={2}
        sx={{
          width: "100%",
          maxWidth: 360,
          mx: "auto",
          alignItems: "stretch",
        }}
      >
        {/* Nom */}
        <StyledTextField
          name="nom"
          label="Nom complet"
          variant="outlined"
          placeholder="Jean Dupont"
          helperText={state.error}
          error={!!state.error}
        />

        {/* Email */}
        <StyledTextField
          name="email"
          label="Email"
          variant="outlined"
          type="email"
          placeholder="contact@votre-cabinet.fr"
          helperText={state.error}
          error={!!state.error}
        />

        {/* Password */}
        <StyledTextField
          name="password"
          label="Mot de passe"
          variant="outlined"
          type="password"
          placeholder="••••••••"
          helperText={state.error}
          error={!!state.error}
        />

        {/* Cabinet */}
        <StyledTextField
          name="cabinet"
          label="Nom du cabinet"
          variant="outlined"
          placeholder="Cabinet Expertise Conseil"
        />

        {/* Spécialités */}
        <StyledTextField
          name="specialites"
          label="Spécialités (séparées par des virgules)"
          variant="outlined"
          placeholder="Fiscalité, Comptabilité, Audit"
        />

        {/* Numéro d'ordre */}
        <StyledTextField
          name="numeroOrdre"
          label="Numéro d'ordre"
          variant="outlined"
          placeholder="12345"
        />

        <Button type="submit" variant="contained">
          S'inscrire
        </Button>

        <Link
          component={NextLink}
          href="/auth/login"
          sx={{
            color: "#667eea",
            textDecoration: "none",
            fontWeight: 500,
            fontSize: "16px",
            textAlign: "center",
            "&:hover": { color: "#764ba2" },
          }}
        >
          Déjà inscrit ? Se connecter
        </Link>
      </Stack>
    </form>
  );
}
