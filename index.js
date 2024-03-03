var express = require('express');
var app = express();
var http = require('http'),
    fs = require('fs'),
    ccav = require('./ccavutil.js'),
    qs = require('querystring'),
    ccavReqHandler = require('./ccavRequestHandler.js'),
    ccavResHandler = require('./ccavResponseHandler.js');
const axios = require('axios');
var cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const products = require('./products')

const mongoUrl = `mongodb+srv://ruby07:8074662205s@cluster0.97u8x.mongodb.net/gaanjUsers`

mongoose.connect(mongoUrl, { useNewUrlParser: true });

const userSchema = {
    uid: String,
    email: String,
    firstName: String,
    lastName: String,
    mobile: String,
    address: String
}

const cartSchema = {
    uid: String,
    cartItems: Array
}


const productSchema = {
    id: String,
    price: Number,
    header: Object,
    about: Object,
    useCases: Object,
    testimonials: Array
}

const Users = new mongoose.model("User", userSchema);
const Products = new mongoose.model("Product", productSchema);
const Cart = new mongoose.model("Cart", cartSchema);


app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public');

//New code
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
// app.engine('html', require('ejs').renderFile);


app.post("/getUser", (req, res) => {
    let userid = req.body.uid;
    Users.findOne({ uid: userid })
        .then(resp => {
            console.log(resp, userid, "backend")
            res.status(200).json({ message: resp })
        })
        .catch(err => [
            res.status(500).json({ message: err })
        ])
})
app.post("/updateUser", (req, res) => {
    const body = req.body;
    console.log(body, "printing...")
    const userid = body.uid;
    const firstName = body.firstName;
    let lastName = body.lastName;
    let mobile = body.mobile;
    let address = body.address;
    Users.updateOne({ uid: userid }, {
        $set: {
            firstName: firstName,
            lastName: lastName,
            mobile: mobile,
            address: address
        }
    })
        .then(resp => {
            res.status(200).json({ message: resp })
        })
        .catch(err => {
            console.log(err);
        })
})

app.post("/addToCart", (req, res) => {
    const pid = req.body.pid;
    const uid = req.body.uid;
    const pdata = products.products[pid - 1];
    let currentCart = [];

    Cart.findOne({ uid: uid })
        .then(resp => {
            currentCart = resp.cartItems;
            let flag = 0;
            console.log(currentCart, "printing")
            currentCart.forEach((ele, idx) => {
                if (ele.pid === pid) {
                    ele.quantity = ele.quantity + 1;
                    flag = 1;
                    // console.log(ele, 'printing inside loop');
                }

            })
            if (flag === 0) {
                const newProduct = {
                    pid: pid,
                    quantity: 1,
                    title: pdata.header.title,
                    image: pdata.header.image,
                    price: pdata.price
                }
                currentCart.push(newProduct);
            }
            Cart.updateOne({ uid: uid }, {
                $set: {
                    cartItems: currentCart
                }
            })
                .then(resp => {
                    console.log("Successfully added to cart", resp)
                    res.send(resp);
                })
                .catch(err => {
                    console.log(err);
                    res.send(err);
                });
            console.log(currentCart);
        })

})
app.post("/getCart", (req, res) => {
    const uid = req.body.uid;
    console.log(req.body.uid);
    Cart.findOne({ uid: uid })
        .then(resp => {
            
            let cartTotal = 0;
            let cart = resp.cartItems;
            cart.forEach((ele,idx)=>{
                cartTotal = cartTotal + (ele.quantity*ele.price);
            })
            // console.log(cartTotal,'pr')
            res.status(200).json({ message: resp, total : cartTotal })
        })
        .catch(err => {
            console.log(err);
        })
})


app.post("/deleteFromCart", (req, res) => {
    const pid = req.body.pid;
    const uid = req.body.uid;
    const del =  req.body.delete;
    let currentCart = [];
    let temp = [];
    Cart.findOne({ uid: uid })
        .then(resp => {
            currentCart = resp.cartItems;
            currentCart.forEach((ele) => {
                console.log(ele,pid,"check");
                if (ele.pid === pid) {
                    
                    ele.quantity = ele.quantity - 1;
                    if(ele.quantity === 0 || del){
                        temp = currentCart.filter((elem)=>{
                            return elem.pid != ele.pid;
                        })
                        currentCart = temp;
                    }
                }
                
            })
            console.log(currentCart,"backend");
            Cart.updateOne({ uid: uid }, {
                $set: {
                    cartItems: currentCart
                }
            })
                .then(resp => {
                    console.log("Successfully added to cart", resp)
                })
                .catch(err => console.log(err));
        })

})


app.post("/users", (req, res) => {
    let userid = req.body.uid;
    let email = req.body.email;
    console.log(userid, email,'ok');

    Users.findOne({ uid: userid })
        .then(resp => {
            if (resp == undefined) {
                const User = new Users({
                    uid: userid,
                    email: email,
                    firstName: null,
                    lastName: null,
                    mobile: null,
                    address: null
                })

                const cart = new Cart({
                    uid: userid,
                    cartItems: []
                })
                cart.save().then(resp => console.log(resp));
                User.save().then(doc => res.status(200).json({ message: doc }));
            }
            else {
                res.status(200).json({ message: resp })
            }
        })
        .catch(err => {
            console.log(err);
        })

})


app.get("/products", (req, res) => {
    res.status(200).json({ message: products });
})




app.get("/", (req, res) => {

    res.send("ok");

})


app.get("/thankyou", (req, res) => {
    res.render("thankYou");
})

app.get('/about:uid', function (req, res) {
    var uid = req.params.uid;
    console.log(req.params.uid, "uid");
    const requestData = {
        query: {
            "filter": `{"buyerInfo.id": "${uid}"}`,
            "paging": {
                limit: 1
            },

        }
    };

    const headerParams = { 'Content-Type': 'application/json', 'Authorization': 'IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcImEyNGQ1NGVmLTU0NWItNDUzYi1iNTE1LTM4MzViODMyZTVjYlwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjViMzVkYWE2LTBjZDAtNGY5MS05YTZlLTM2MzU3ZGQzYjBmN1wifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIyMWI1NWE1Ni1lMGE1LTQ2YzctYWY4YS1jYTg5MjdlOGQ1ZDlcIn19IiwiaWF0IjoxNjk0NTk4NTIwfQ.A3bWpBxcO6b6sgYHyH2IcFSV3b4GvjNoYAiKh2uQIdMnkKNXTAHNoMA5QhdfFzpUgIOLSiOD7vecPjoroKngOfcjGbKZ_8ZAMD0dGaLycPSe5j1WkKTYHnufIjF2PZncW1mKGpTO8Fro7u8ZUOOuh-Omm74y4NBIPzZfnt87pqRFjHYZviKm_yBOKFMhSEEBLXTQNv-b9F8SBo9IQlEAfFMSADZqlJmnJL7hFW4oy7JH-qZWERGIggmC2dm54V6kh_aN21ucvHI9jXLFmNsBIJC1YMlMKP4_JgL2wwOT5BcgOkbCWkGLqiiiZBCm2qojK_Bk8Lgmvl3Cd04Z39AKRQ', 'wix-site-id': 'f98748ec-9534-4427-8ff8-fb5e6d398ac4' }


    var orderDetails;
    let orderId;
    let cartTotal;
    axios.post("https://www.wixapis.com/stores/v2/orders/query", requestData, { headers: headerParams })
        .then(resp => {
            orderDetails = resp.data.orders;
            // console.log(orderDetails[0],"done");
            // console.log(res.data.orders[0].buyerInfo);
            // console.log(res.data.orders,"orders");
            if (orderDetails) {

                cartTotal = (orderDetails[0].totals.total);
                orderId = orderDetails[0].number;
                res.render('dataFrom', { order: orderId, total: cartTotal });
            }
        })
        .catch(err => {
            console.log(err);
        })




});

app.post('/ccavRequestHandler', function (request, response) {
    ccavReqHandler.postReq(request, response);
});


app.post('/ccavResponseHandler', function (request, response) {
    ccavResHandler.postRes(request, response);
});

app.listen(3000, function (req, res) {
    console.log("Server started ....");
});
