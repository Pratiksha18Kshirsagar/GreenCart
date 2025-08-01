//place order COD :/api/order/cod

import Product from "../models/Product.js";
import Order from '../models/order.js'
import stripe from 'stripe'
import User from '../models/User.js'


//Place order by COD : api/order/COD
export const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.user.id;
        const { items, address } = req.body;
        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid Data" })
        }
        //calculate Amount using items
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            return (await acc) + product.offerPrice * item.quantity;
        }, 0)

        //add tax charges(2%)
        amount += Math.floor(amount * 0.02);
        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
        });
        return res.json({ success: true, message: "order placed successfully" })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}



//Place order by Stripe : api/order/stripe
export const placeOrderStripe = async (req, res) => {
    try {
        const userId = req.user.id;
        const { items, address } = req.body;
        const { origin } = req.headers;
        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid Data" })
        }
        let productData = [];

        //calculate Amount using items
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            })
            return (await acc) + product.offerPrice * item.quantity;
        }, 0)

        //add tax charges(2%)
        amount += Math.floor(amount * 0.02);
        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online",
        });

        //Stripe GateWay Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        //create line items for stripe
        const line_items = productData.map((item) => {
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.floor(item.price + item.price * 0.02) * 100
                },
                quantity: item.quantity,
            }
        })


        //create session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(),
                userId,
            }
        })

        return res.json({ success: true, url: session.url })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}


//Stripe webhooks to verify payment actions
export const stripeWebhooks = async (req, res) => {
    //stripe gateway initializes
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = requestAnimationFrame.headers['stripe-signature'];
    let event;
    try {
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
        response.status(400).send(`webhook Error:${error.message}`)
    }

    //Handel the event
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;
            //Getting session Metadata 
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,

            });
            const { orderId, userId } = session.data[0].metadata;


            //mark payment as failed
            await Order.findByIdAndUpdate(orderId, { isPaid: true })
            //clear user cart
            await User.findByIdAndUpdate(userId, { cartItems: {} });
            break;

        }
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            //Getting session Metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });
            const { orderId, userId } = session.data[0].metadata;
            await Order.findByIdAndDelete(orderId);
            break;
        }
        default:
            console.error(`Unhandled event type ${event.type}`)
            break;
    }
    response.json({recieved:true})
}








//get order by user ID : /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({
            userId,
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}



//Get all orders (for seller / admin : /api/order/seller)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}
