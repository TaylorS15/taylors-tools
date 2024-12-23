import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";

interface StripeCheckout {
  enabled: boolean;
  showStripeCheckout: boolean;
  setShowStripeCheckout: Dispatch<SetStateAction<boolean>>;
  stripePriceId: string;
  onPaymentSuccess: (clientSecret: string) => void;
}

const CheckoutContext = createContext<StripeCheckout | undefined>(undefined);

interface CheckoutProviderProps {
  enabled: boolean;
  stripePriceId: string;
  onPaymentSuccess: (clientSecret: string) => void;
  children: ReactNode;
}

export const CheckoutProvider = ({
  enabled,
  stripePriceId,
  onPaymentSuccess,
  children,
}: CheckoutProviderProps) => {
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);

  const value: StripeCheckout = {
    enabled,
    showStripeCheckout,
    setShowStripeCheckout,
    stripePriceId,
    onPaymentSuccess,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);

  if (!context) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }

  return context;
};
