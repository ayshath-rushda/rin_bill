import Setting from '../models/Setting.js';
import AppError from '../utils/AppError.js';

export const getAll = async (req, res, next) => {
  try {
    const settings = await Setting.find().lean();
    const map = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    res.json({ success: true, data: map });
  } catch (error) {
    next(error);
  }
};

export const getByKey = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key }).lean();
    if (!setting) {
      throw new AppError('Setting not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value },
      { new: true, upsert: true }
    ).lean();
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

export const updateBulk = async (req, res, next) => {
  try {
    const ops = Object.entries(req.body).map(([key, value]) => ({
      updateOne: { filter: { key }, update: { value }, upsert: true },
    }));
    await Setting.bulkWrite(ops);
    const settings = await Setting.find().lean();
    const map = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    res.json({ success: true, data: map });
  } catch (error) {
    next(error);
  }
};
