"use client";

import { Button, Link, Stack, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import NextLink from "next/link";
import { useActionState } from "react";
import login from "./login";

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

const StyledButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(2, 3),
  fontSize: "16px",
  fontWeight: 600,
  textTransform: "none",
  boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%)",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
}));

export default function Login() {
  const [state, formAction] = useActionState(login, { error: "" });
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
        <StyledTextField
          error={!!state.error}
          helperText={state.error}
          name="email"
          label="Email"
          variant="outlined"
          type="email"
          placeholder="votre.email@cabinet.fr"
        />
        <StyledTextField
          error={!!state.error}
          helperText={state.error}
          name="password"
          label="Password"
          variant="outlined"
          type="password"
          placeholder="••••••••"
        />
        <StyledButton type="submit" variant="contained">
          Login
        </StyledButton>
        <Link
          component={NextLink}
          href="/auth/signup"
          sx={{
            color: "#667eea",
            textDecoration: "none",
            fontWeight: 500,
            fontSize: "16px",
            textAlign: "center",
            "&:hover": { color: "#764ba2" },
          }}
        >
          Signup
        </Link>
      </Stack>
    </form>
  );
}
