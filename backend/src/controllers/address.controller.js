import Address from '../models/Address.js';
import AppError from '../utils/AppError.js';

export const list = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const count = await Address.countDocuments({ user: req.user._id });
    const data = { ...req.body, user: req.user._id };
    if (count === 0) {
      data.isDefault = true;
    }
    const address = await Address.create(data);
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      throw new AppError('Address not found', 404, 'NOT_FOUND');
    }
    Object.assign(address, req.body);
    await address.save();
    res.json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      throw new AppError('Address not found', 404, 'NOT_FOUND');
    }
    const count = await Address.countDocuments({ user: req.user._id });
    if (count <= 1) {
      throw new AppError('Cannot delete your only address', 400, 'LAST_ADDRESS');
    }
    await Address.deleteOne({ _id: req.params.id });
    res.json({ success: true, data: { message: 'Address deleted' } });
  } catch (error) {
    next(error);
  }
};

export const setDefault = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) {
      throw new AppError('Address not found', 404, 'NOT_FOUND');
    }
    await Address.updateMany(
      { user: req.user._id },
      { $set: { isDefault: false } }
    );
    address.isDefault = true;
    await address.save();
    res.json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};
