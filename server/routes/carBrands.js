const express = require('express');
const router = express.Router();
const carBrandsController = require('../controllers/carBrandsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, carBrandsController.listBrands);
router.post('/', requireAuth, carBrandsController.createBrand);

module.exports = router;
