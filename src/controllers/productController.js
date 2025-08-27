const prisma = require('../utils/prisma');

const createProduct = async (req, res) => {
    console.log('Creating product');
    const { name, price, description, stock, category } = req.body;
    console.log(req.body);
    const imageUrls = req.files.map(file => file.path);
    console.log('Image URLs:', imageUrls);
    console.log('Request body:', req.body);

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
    console.log('Fetching paginated products');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    console.log('Page:', page, 'Limit:', limit, 'Skip:', skip);

    try {
        const products = await prisma.product.findMany({
            take: limit,
            skip: skip,
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

        const totalProducts = await prisma.product.count();

        console.log(products);
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
        console.log(productsWithAverageRating);
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
    console.log('Fetching featured products');
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
            include: { images: true },
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product' });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    console.log('Updating product with ID:', id);
    console.log('Request body:', req.body);
    const { name, description, price, stock, category } = req.body;



    const imageUrls = req.files.map(file => file.path);

    console.log('Image URLs:', imageUrls);

    if (!name || !description || !price || !stock || !category) {
        return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const categoryRecord = await prisma.category.findUnique({
        where: { name: category }
    });

    console.log('Category record:', categoryRecord);

    try {
        console.log('Updating product in database...');
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
        console.log('Updated product:', updatedProduct);
        return res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong while updating the product. Try again later' });
    }


}

const deleteProduct = async (req, res) => {
    console.log('Deleting product');
    const { id } = req.params;
    console.log('this is the products id', id);
    try {
        const product = await prisma.product.findUnique({
            where: {
              id: id, // assuming `id` is your primary key
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

module.exports = { createProduct, getProducts, getProductById, deleteProduct, updateProduct, getFeaturedProducts }