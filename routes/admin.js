var express = require('express');
const { helpers } = require('handlebars');
var router = express.Router();
var producthelp = require('../help/product-help');
/* GET users listing. */
router.get('/', function (req, res, next) {
  producthelp.getAllProducts().then((products)=>{
    console.log(products);
    res.render('admin/view-products', { admin: true, products});
  })
  
});

router.get('/add-product', function (req, res) {
  res.render('admin/add-product', { admin: true })
})
router.post('/add-product', (req, res) => {
  console.log(req.body);
  console.log(req.files.image);

  producthelp.addProduct(req.body, (id) => {
    let image = req.files.image;
    image.mv('./public/product-images/'+id+ '.jpg', (err) => {
      if (!err) {
        res.render("admin/add-product")
      }
      else{
        console.log(err);
      }
    })
  })
})
router.get('/delete-product/:id',(req,res)=>{
  let prodId=req.params.id
  console.log(prodId);
  producthelp.deleteProduct(prodId).then((response)=>{
    res.redirect('/admin/')
  })
})
router.get('/edit-product/:id',async (req,res)=>{
  let product=await producthelp.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{product})
})
router.post('/edit-product/:id',(req,res)=>{
  console.log(req.params.id);
  let id=req.params.id 
  producthelp.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.image){
    let image=req.files.image
    image.mv('./public/product-images/'+id+ '.jpg')
  }
  })
})
module.exports = router;
