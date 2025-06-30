const prisma = require('../utils/prisma');

const createProduct = async (req, res) => {
    const { name, price, description } = req.body;

    const imageUrls = req.files.map(file => file.path);

    try {
        const product = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                description,
                images: {
                    create: imageUrls.map(url => ({ url })),
                },
            },
            include: { images: true },
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create product' });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { images: true },
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "'Failed to fetch products'" });
    }
};

const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { images: true },
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product' });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete product' });
    }
};

module.exports = { createProduct, getAllProducts, getProductById, deleteProduct, }