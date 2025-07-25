
import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { dummyProducts } from '../assets/assets';
import toast from 'react-hot-toast';


// 1️⃣ Create the context
export const AppContext = createContext();


// 2️⃣ Create a provider component
export const AppContextProvider = ({ children }) => {
    const currency = import.meta.VITE_CURRENCY;    
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [searchQuery, setSearchQuery] = useState({});


    //fetch all products
    const fetchProducts = async () => {
        setProducts(dummyProducts);
    }

    useEffect(() => {
        fetchProducts();
    }, []);


    //Add products to cart
    const addToCart = (itemId) => {
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartData[itemId] += 1;
        } else {
            cartData[itemId] = 1;
        }
        setCartItems(cartData);
        toast.success("Added to cart")
    }

    //update cart item quantity
    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId] = quantity;
        setCartItems(cartData)
        toast.success("Cart Updated")
    }


    //Remove item from cart
    const removeFromCart = (itemId)=>{
        const cartData = structuredClone(cartItems);
        if(cartData[itemId]){
            cartData[itemId] -= 1;
            if(cartData[itemId] === 0){
                delete cartData[itemId];
            }
        }
        setCartItems(cartData);
        toast.success("Reomved from cart");
        

    }

    const value = { navigate, user, setUser, setIsSeller, isSeller, showUserLogin, setShowUserLogin, products, currency, addToCart, updateCartItem ,removeFromCart , cartItems , searchQuery , setSearchQuery};

    return <AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>

}


// 3️⃣ Custom hook to use context
export const useAppContext = () => {
    return useContext(AppContext);
}


