const prisma = require('../utils/prisma');

const createProduct = async (req, res) => {
    const { name, price, description, stock, category } = req.body;
    const imageUrls = req.files.map(file => file.path);

    if (!name || !description || !price || !stock || !category) {
        return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const categoryRecord = await prisma.category.findUnique({
        where: { name: category }
    });


    try {

        if (!categoryRecord) {
            return res.status(400).json({ message: 'Invalid category provided' });
        }

        const product = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                description,
                stock: parseInt(stock),
                category: {
                    connect: { id: categoryRecord.id }
                },
                images: {
                    create: imageUrls.map(url => ({ url })),
                },
            },
            include: { images: true, category: true },
        });

        res.status(201).json({
            message: 'Product created successfully',
        })
    } catch (error) {
        res.status(500).json({ message: 'Failed to create product' });
    }

};

const getProducts = async (req, res) => {

    console.log("Fetching products...");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
 
    const { category, sort } = req.query;

    let orderBy = { createdAt: "desc" };

    if (sort === "oldest") orderBy = { createdAt: "asc" };
    if (sort === "low-high") orderBy = { price: "asc" };
    if (sort === "high-low") orderBy = { price: "desc" };
    if (sort === "popular") orderBy = { amountSold: "desc" };

    const where = {};
    if (category) {
        where.category = { name: category };
    }

    try {
        const products = await prisma.product.findMany({
            take: limit,
            skip: skip,
            where,
            orderBy,
            select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                description: true,
                images: {
                    select: { url: true },
                },
                reviews: {
                    select: { rating: true },
                },
                _count: {
                    select: { reviews: true },
                },
                category: true,
            },
        });

        const totalProducts = await prisma.product.count({ where });

        const productsWithAverageRating = products.map((product) => {
            const ratings = product.reviews.map((review) => review.rating);
            const averageRating =
                ratings.reduce((sum, rating) => sum + rating, 0) / (ratings.length || 1);

            return {
                id: product.id,
                name: product.name,
                price: product.price,
                description: product.description,
                stock: product.stock,
                images: product.images || null,
                averageRating: parseFloat(averageRating.toFixed(2)),
                category: product.category,
                reviewCount: product._count.reviews,
            }
        });
        
        res.json({
            page,
            limit,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            products: productsWithAverageRating,
        });
    } catch (error) {
        res.status(500).json({ message: "'Failed to fetch products'" });
    }
};

const getFeaturedProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            take: 8,
            orderBy: {
                amountSold: 'desc',
            },
            select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                images: {
                    select: { url: true },
                },
                reviews: {
                    select: { rating: true },
                },
                _count: {
                    select: { reviews: true },
                },
                amountSold: true,
            },
        });

        const featuredProducts = products.map((product) => {
            const ratings = product.reviews.map((review) => review.rating);
            const averageRating =
                ratings.reduce((sum, rating) => sum + rating, 0) / (ratings.length || 1);

            return {
                id: product.id,
                name: product.name,
                price: product.price,
                description: product.description,
                images: product.images || [],
                averageRating: parseFloat(averageRating.toFixed(2)),
                reviewCount: product._count.reviews,
            };
        });

        res.json({ success: true, products: featuredProducts });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch featured products' });
    }
};


const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { 
                images: true,
                _count: { select: { reviews: true } },
                reviews: { select: { rating: true } } },
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const totalReviews = product._count.reviews;
        const averageRating =
          totalReviews > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;


        res.json({
            ...product,
            averageRating,
            totalReviews,
    });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product' });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
  
    const { name, description, price, stock, category } = req.body;

    const imageUrls = req.files.map(file => file.path);

    if (!name || !description || !price || !stock || !category) {
        return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const categoryRecord = await prisma.category.findUnique({
        where: { name: category }
    });

    try {
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock),
                category: {
                    connect: { id: categoryRecord.id }
                },
                images: {
                    deleteMany: {},
                    create: imageUrls.map((url) => ({ url })),
                },
            },
            include: {
                images: true,
            },
        });
      
        return res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong while updating the product. Try again later' });
    }


}

const searchProducts = async (req, res) => {

    console.log("Searching products...");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { q, sort } = req.query;

    let orderBy = { createdAt: "desc" };

    if (sort === "oldest") orderBy = { createdAt: "asc" };
    if (sort === "low-high") orderBy = { price: "asc" };
    if (sort === "high-low") orderBy = { price: "desc" };
    if (sort === "popular") orderBy = { amountSold: "desc" };

    if (!q || q.trim() === "") {
        return res.status(400).json({ success: false, message: "Search query is required" });
    }
    try {
        const where = {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { category: { name: { contains: q, mode: "insensitive" } } },
            ],
        };

        const products = await prisma.product.findMany({
            take: limit,
            skip,
            where,
            orderBy,
            select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                description: true,
                images: {
                    select: { url: true },
                },
                reviews: {
                    select: { rating: true },
                },
                _count: {
                    select: { reviews: true },
                },
                category: true,
            },
        });

        const totalProducts = await prisma.product.count({ where });

        const productsWithAverageRating = products.map((product) => {
            const ratings = product.reviews.map((review) => review.rating);
            const averageRating =
                ratings.reduce((sum, rating) => sum + rating, 0) / (ratings.length || 1);

            return {
                id: product.id,
                name: product.name,
                price: product.price,
                description: product.description,
                stock: product.stock,
                images: product.images || null,
                averageRating: parseFloat(averageRating.toFixed(2)),
                category: product.category,
                reviewCount: product._count.reviews,
            };
        });

        res.json({
            success: true,
            query: q,
            page,
            limit,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            products: productsWithAverageRating,
        });
    } catch (error) {
        console.error("Error searching products:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const deleteProduct = async (req, res) => {
    console.log('Deleting product');
    const { id } = req.params;
    console.log('this is the products id', id);
    try {
        const product = await prisma.product.findUnique({
            where: {
                id: id, 
            },
        });

        console.log('Product found:', product);
        await prisma.product.delete({ where: { id } });
        console.log('Product deleted successfully');
        res.status(200).json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Delete failed:', error);
        res.status(500).json({ message: 'Error while trying to delete product' });
    }
};

module.exports = { createProduct, getProducts, getProductById, deleteProduct, updateProduct, getFeaturedProducts, searchProducts }