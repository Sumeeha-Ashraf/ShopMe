var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const { ObjectId } = require('mongodb')
const collections = require('../config/collections')
const { response } = require('express')
module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.insertedId)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("login successfull");
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log("Unsuccessfull");
                        resolve({ status: false })
                    }
                })
            }
            else {
                console.log("login failed");
                resolve({ status: false })
            }
        })
    },
    addToCart: (prodId, userId) => {
        let proObj = {
            item: objectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(products => products.item == prodId)
                console.log(proExist)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(prodId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                }
                else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }
                        ).then((response) => {
                            resolve()
                        })
                }
            }
            else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.products) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
            }
            else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.products) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }).then((response) => {
                            resolve({status:true})
                        })
                    }
                })

        },
        getTotalAmount:(userId)=>{
            return new Promise(async (resolve, reject) => {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'products'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                        }
                    },
                    {
                        $group:{
                            _id:null,
                            total:{$sum:{$multiply:['$quantity','$products.price']}}
                        }
                    }
                ]).toArray()
                console.log("hloooooooo")
                console.log(total)
                resolve(total[0].total)
            })
        }
}
