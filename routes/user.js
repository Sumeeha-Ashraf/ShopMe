var express = require('express');
var router = express.Router();
const producthelp = require('../help/product-help');
const userhelp = require('../help/user-help');
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }
  else{
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
  console.log(user)
  let cartCount = null
  if(req.session.user){
  cartCount = await userhelp.getCartCount(req.session.user._id)
  }
  producthelp.getAllProducts().then((products)=>{
    res.render('user/view-products',{products,user,cartCount});
  })
});
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
  res.render('user/login',{"loginErr":req.session.loginErr})
  req.session.loginErr=false
}
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
 userhelp.doSignup(req.body).then((response)=>{
   console.log(response);
   req.session.loggedIn=true
   req.session.user=response
   res.redirect('/')
 })
})
 router.post('/login',(req,res)=>{
   userhelp.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }
    else{
      req.session.loginErr="Invalid username or password!"
      res.redirect('/login')
    }
   })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/login')
}) 
router.get('/cart',verifyLogin,async(req,res)=>{
  let products=await userhelp.getCartProducts(req.session.user._id)
  let carttotal = await userhelp.getTotalAmount(req.session.user._id)
  console.log(products);
  res.render('user/cart',{products,user:req.session.user,carttotal}) 
})
router.get('/add-to-cart/:id',(req,res)=>{
  userhelp.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  userhelp.changeProductQuantity(req.body).then((response)=>{
    res.json(response)

  })
})
module.exports = router;