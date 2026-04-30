const express = require('express');
const Wallet = require('../models/Wallet');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get Wallet Balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    res.json({
      balance: wallet.balance,
      exposure: wallet.exposure,
      totalDeposited: wallet.totalDeposited,
      totalWithdrawn: wallet.totalWithdrawn
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deposit
router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.userId },
      {
        $inc: {
          balance: amount,
          totalDeposited: amount
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      message: 'Deposit successful',
      balance: wallet.balance,
      amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Withdraw
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = await Wallet.findOne({ userId: req.userId });
    
    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const updated = await Wallet.findOneAndUpdate(
      { userId: req.userId },
      {
        $inc: {
          balance: -amount,
          totalWithdrawn: amount
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      message: 'Withdrawal successful',
      balance: updated.balance,
      amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;