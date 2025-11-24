"use client"

import { Button } from "@mui/material";
import checkout from "./actions/checkout";

// Définition de l'enum StatusFacture
enum StatusFacture {
  BROUILLON = 'BROUILLON',
  VALIDEE = 'VALIDEE',
  ENVOYEE = 'ENVOYEE',
  PAYEE = 'PAYEE',
  ANNULEE = 'ANNULEE',
  EN_RETARD = 'EN_RETARD'
}

interface CheckoutProps {
    factureId: number;
    status: StatusFacture; // Ajout du statut
}

export default function Checkout({ factureId, status }: CheckoutProps) {
    // Vérifier si la facture peut être payée
    const canBePaid = [
        StatusFacture.VALIDEE, 
        StatusFacture.ENVOYEE, 
        StatusFacture.EN_RETARD
    ].includes(status);
    const isPaid = status === StatusFacture.PAYEE;

    const handleCheckout = async () => {
        const session = await checkout(factureId);
        
        // Get the checkout URL from the session
        const checkoutUrl = session?.url;
        
        if (!checkoutUrl) {
            console.error("No checkout URL in session:", session);
            alert("Erreur lors de la création de la session de paiement");
            return;
        }
        
        // Simple redirect to Stripe's hosted checkout page
        window.location.href = checkoutUrl;
    }
    
    return (
        <Button 
            variant="contained" 
            className="max-w-[25%]" 
            onClick={handleCheckout}
            disabled={!canBePaid || isPaid}
            sx={{
                backgroundColor: isPaid ? '#10b981' : undefined,
                '&:disabled': {
                    backgroundColor: isPaid ? '#10b981' : undefined,
                    color: 'white',
                    opacity: isPaid ? 1 : 0.6
                }
            }}
        >
            {isPaid ? '✓ Payée' : 'Payer'}
        </Button>
    );
}