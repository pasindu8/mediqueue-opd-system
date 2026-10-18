const Feedback = require('../models/Feedback');
const asyncHandler = require('../middleware/asyncHandler');

// 1. CREATE Feedback (C)
const createFeedback = asyncHandler(async (req, res) => {
  const { userId, patientId, patientName, hospitalId, hospitalName, category, rating, comment } = req.body;

  if (!rating || !comment) {
    res.status(400);
    throw new Error('Rating and comment are required to submit feedback');
  }

  const feedback = await Feedback.create({
    userId: userId || null,
    patientId: patientId || null,
    patientName: patientName || 'Patient',
    hospitalId: hospitalId || null,
    hospitalName: hospitalName || 'Kalutara General Hospital',
    category: category || 'Doctor Consultation',
    rating: Number(rating),
    comment: comment.trim(),
    status: 'submitted',
  });

  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully. Thank you for helping improve our hospital service.',
    feedback,
  });
});

// 2. READ Patient Feedback & Hospital Feedback (R)
const getPatientFeedback = asyncHandler(async (req, res) => {
  const { userId, patientId, hospitalId } = req.body;

  const query = {};
  if (userId) query.userId = userId;
  else if (patientId) query.patientId = patientId;
  else if (hospitalId) query.hospitalId = hospitalId;

  const feedbackList = await Feedback.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    feedback: feedbackList,
  });
});

// 3. UPDATE Feedback (U)
const updateFeedback = asyncHandler(async (req, res) => {
  const { feedbackId, rating, comment, category } = req.body;

  if (!feedbackId) {
    res.status(400);
    throw new Error('Feedback ID is required');
  }

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    res.status(404);
    throw new Error('Feedback record not found to update');
  }

  if (rating) feedback.rating = Number(rating);
  if (comment) feedback.comment = comment.trim();
  if (category) feedback.category = category;

  await feedback.save();

  res.status(200).json({
    success: true,
    message: 'Your feedback review has been updated successfully',
    feedback,
  });
});

// 4. DELETE Feedback (D)
const deleteFeedback = asyncHandler(async (req, res) => {
  const { feedbackId } = req.body;

  if (!feedbackId) {
    res.status(400);
    throw new Error('Feedback ID is required');
  }

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    res.status(404);
    throw new Error('Feedback record not found to delete');
  }

  await Feedback.deleteOne({ _id: feedbackId });

  res.status(200).json({
    success: true,
    message: 'Feedback review removed successfully',
  });
});

module.exports = {
  createFeedback,
  getPatientFeedback,
  updateFeedback,
  deleteFeedback,
};
