"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

type ShopStateValue = {
  cartItems: { productId: string; quantity: number }[];
  cartIds: string[];
  favoriteIds: string[];
  addToCart: (id: string, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  setCartQuantity: (id: string, quantity: number) => void;
  decrementCartItem: (id: string) => void;
  clearCart: () => void;
  toggleFavorite: (id: string) => void;
  isInCart: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  getCartQuantity: (id: string) => number;
};

const CART_KEY = "standard-shop-cart";
const FAVORITES_KEY = "standard-shop-favorites";

const ShopStateContext = createContext<ShopStateValue | null>(null);

export function ShopStateProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const savedCart = window.localStorage.getItem(CART_KEY);
    const savedFavorites = window.localStorage.getItem(FAVORITES_KEY);

    if (savedCart) {
      const parsed = JSON.parse(savedCart) as unknown;
      if (Array.isArray(parsed)) {
        if (parsed.every((item) => typeof item === "string")) {
          setCartItems(parsed.map((productId) => ({ productId, quantity: 1 })));
        } else {
          setCartItems(
            parsed
              .filter(
                (item): item is { productId: string; quantity: number } =>
                  Boolean(
                    item &&
                      typeof item === "object" &&
                      "productId" in item &&
                      typeof item.productId === "string" &&
                      "quantity" in item &&
                      typeof item.quantity === "number"
                  )
              )
              .map((item) => ({
                productId: item.productId,
                quantity: Math.max(1, Math.trunc(item.quantity))
              }))
          );
        }
      }
    }

    if (savedFavorites) {
      setFavoriteIds(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const cartIds = useMemo(() => cartItems.map((item) => item.productId), [cartItems]);

  const value = useMemo<ShopStateValue>(
    () => ({
      cartItems,
      cartIds,
      favoriteIds,
      addToCart: (id, quantity = 1) => {
        setCartItems((current) => {
          const index = current.findIndex((item) => item.productId === id);
          if (index === -1) {
            return [...current, { productId: id, quantity: Math.max(1, quantity) }];
          }

          return current.map((item, itemIndex) =>
            itemIndex === index
              ? { ...item, quantity: item.quantity + Math.max(1, quantity) }
              : item
          );
        });
      },
      removeFromCart: (id) => {
        setCartItems((current) => current.filter((item) => item.productId !== id));
      },
      setCartQuantity: (id, quantity) => {
        setCartItems((current) =>
          quantity <= 0
            ? current.filter((item) => item.productId !== id)
            : current.map((item) =>
                item.productId === id ? { ...item, quantity: Math.max(1, Math.trunc(quantity)) } : item
              )
        );
      },
      decrementCartItem: (id) => {
        setCartItems((current) =>
          current.flatMap((item) => {
            if (item.productId !== id) {
              return [item];
            }

            if (item.quantity <= 1) {
              return [];
            }

            return [{ ...item, quantity: item.quantity - 1 }];
          })
        );
      },
      clearCart: () => {
        setCartItems([]);
      },
      toggleFavorite: (id) => {
        setFavoriteIds((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
      },
      isInCart: (id) => cartIds.includes(id),
      isFavorite: (id) => favoriteIds.includes(id),
      getCartQuantity: (id) => cartItems.find((item) => item.productId === id)?.quantity ?? 0
    }),
    [cartIds, cartItems, favoriteIds]
  );

  return <ShopStateContext.Provider value={value}>{children}</ShopStateContext.Provider>;
}

export function useShopState() {
  const context = useContext(ShopStateContext);

  if (!context) {
    throw new Error("useShopState must be used inside ShopStateProvider");
  }

  return context;
}
