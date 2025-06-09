const registerUser = (req, res) => {
    res.status(201).json({ message: "User registered (placeholder)" });
  };
  
  const loginUser = (req, res) => {
    res.status(200).json({ message: "User logged in (placeholder)" });
  };
  
  module.exports = { registerUser, loginUser };