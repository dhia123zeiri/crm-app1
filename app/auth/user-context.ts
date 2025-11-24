import { createContext } from "react";
import { TokenPayload } from "./get-user";

export const UserContext = createContext<TokenPayload | null>(null);
