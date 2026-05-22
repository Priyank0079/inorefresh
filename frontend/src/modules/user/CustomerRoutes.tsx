import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { CartProvider } from "../../context/CartContext";
import { OrdersProvider } from "../../context/OrdersContext";
import { LocationProvider } from "../../context/LocationContext";
import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import IconLoader from "../../components/loaders/IconLoader";

// Lazy load user pages
const Home = lazy(() => import("./Home"));
const Cart = lazy(() => import("./Cart"));
const Checkout = lazy(() => import("./Checkout"));
const CheckoutAddress = lazy(() => import("./CheckoutAddress"));
const ProductDetail = lazy(() => import("./ProductDetail"));
const Search = lazy(() => import("./Search"));
const Orders = lazy(() => import("./Orders"));
const OrderDetail = lazy(() => import("./OrderDetail"));
const OrderAgain = lazy(() => import("./OrderAgain"));
const Account = lazy(() => import("./Account"));
const Categories = lazy(() => import("./Categories"));
const Category = lazy(() => import("./Category"));
const Invoice = lazy(() => import("./Invoice"));
const AboutUs = lazy(() => import("./AboutUs"));
const FAQ = lazy(() => import("./FAQ"));
const Wishlist = lazy(() => import("./Wishlist"));
const Addresses = lazy(() => import("./Addresses"));
const AddressBook = lazy(() => import("./AddressBook"));
const SpiritualStore = lazy(() => import("./SpiritualStore"));
const PharmaStore = lazy(() => import("./PharmaStore"));
const EGiftStore = lazy(() => import("./EGiftStore"));
const PetStore = lazy(() => import("./PetStore"));
const SportsStore = lazy(() => import("./SportsStore"));
const FashionStore = lazy(() => import("./FashionStore"));
const ToyStore = lazy(() => import("./ToyStore"));
const HobbyStore = lazy(() => import("./HobbyStore"));
const StorePage = lazy(() => import("./StorePage"));
const RetailerReturnSession = lazy(() => import("./RetailerReturnSession"));

export default function CustomerRoutes() {
  return (
    <LocationProvider>
      <CartProvider>
        <OrdersProvider>
          <AppLayout>
            <Suspense fallback={<IconLoader forceShow />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/user/home" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/orders/:id/inspection" element={<RetailerReturnSession />} />
                <Route path="/order-again" element={<OrderAgain />} />
                <Route path="/account" element={<Account />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/category/:id" element={<Category />} />
                <Route path="/address-book" element={<AddressBook />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute redirectTo="/login">
                      <Suspense fallback={<IconLoader forceShow />}>
                        <Checkout />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout/address"
                  element={
                    <ProtectedRoute redirectTo="/login">
                      <Suspense fallback={<IconLoader forceShow />}>
                        <CheckoutAddress />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/invoice/:id" element={<Invoice />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/addresses" element={<Addresses />} />
                <Route path="/store/:slug" element={<StorePage />} />
                <Route path="/store/spiritual" element={<SpiritualStore />} />
                <Route path="/store/pharma" element={<PharmaStore />} />
                <Route path="/store/e-gifts" element={<EGiftStore />} />
                <Route path="/store/pet" element={<PetStore />} />
                <Route path="/store/sports" element={<SportsStore />} />
                <Route path="/store/fashion-basics" element={<FashionStore />} />
                <Route path="/store/toy" element={<ToyStore />} />
                <Route path="/store/hobby" element={<HobbyStore />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </OrdersProvider>
      </CartProvider>
    </LocationProvider>
  );
}
