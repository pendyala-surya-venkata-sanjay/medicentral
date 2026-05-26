import Billing from '../models/Billing.js';
import Payment from '../models/Payment.js';
import Patient from '../models/Patient.js';
import { resolvePatientFromRequest } from '../utils/mediaAccess.js';
import { publicUrl } from '../middleware/uploadMiddleware.js';
import { generateInvoiceNumber, PAYMENT_METHODS } from '../utils/indiaHealthcare.js';
import { logActivity } from '../utils/auditLogger.js';

const calcTotals = (items, gstRate = 0) => {
  const subtotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const gstAmount = Math.round(subtotal * (Number(gstRate) / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;
  return { subtotal, gstAmount, totalAmount };
};

export const createBill = async (req, res, next) => {
  try {
    const { patientId, items, dueDate, notes, visitId, gstRate, insuranceStatus, insuranceProvider } =
      req.body;
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    const { subtotal, gstAmount, totalAmount } = calcTotals(parsedItems, gstRate);
    const invoiceNumber = await generateInvoiceNumber(Billing);

    const bill = await Billing.create({
      patient: patient._id,
      visit: visitId || undefined,
      invoiceNumber,
      items: parsedItems,
      subtotal,
      gstRate: Number(gstRate) || 0,
      gstAmount,
      totalAmount,
      currency: 'INR',
      dueDate,
      notes,
      insuranceStatus: insuranceStatus || 'none',
      insuranceProvider,
      createdBy: req.user._id,
      invoiceUrl: req.file ? publicUrl(req.file) : undefined,
    });

    await logActivity(req, 'bill_created', 'billing', bill._id, { totalAmount });
    res.status(201).json(bill);
  } catch (error) {
    next(error);
  }
};

export const getBills = async (req, res, next) => {
  try {
    if ((req.user.role === 'staff' || req.user.role === 'admin') && !req.params.patientId) {
      const bills = await Billing.find()
        .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 })
        .limit(100);
      return res.json(bills);
    }

    const patient = await resolvePatientFromRequest(req.user, req.params.patientId);
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const bills = await Billing.find({ patient: patient._id }).sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { amount, method, reference } = req.body;
    const payMethod = PAYMENT_METHODS.includes(method) ? method : 'cash';

    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      res.status(404);
      throw new Error('Bill not found');
    }

    const payAmount = Number(amount);
    bill.amountPaid = (bill.amountPaid || 0) + payAmount;
    bill.payments.push({ amount: payAmount, method: payMethod, reference, paidAt: new Date() });

    if (bill.amountPaid >= bill.totalAmount) bill.status = 'paid';
    else if (bill.amountPaid > 0) bill.status = 'partial';
    else bill.status = 'pending';

    await bill.save();

    await Payment.create({
      billing: bill._id,
      patient: bill.patient,
      amount: payAmount,
      method: payMethod,
      reference,
      receivedBy: req.user._id,
    });

    await logActivity(req, 'payment_recorded', 'billing', bill._id, { amount: payAmount, method: payMethod });
    res.json(bill);
  } catch (error) {
    next(error);
  }
};

export const updateBill = async (req, res, next) => {
  try {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      res.status(404);
      throw new Error('Bill not found');
    }

    if (req.body.items) {
      bill.items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;
      const totals = calcTotals(bill.items, req.body.gstRate ?? bill.gstRate);
      bill.subtotal = totals.subtotal;
      bill.gstAmount = totals.gstAmount;
      bill.totalAmount = totals.totalAmount;
    }
    if (req.body.gstRate !== undefined) bill.gstRate = Number(req.body.gstRate);
    if (req.body.notes !== undefined) bill.notes = req.body.notes;
    if (req.body.dueDate !== undefined) bill.dueDate = req.body.dueDate;
    if (req.body.insuranceStatus) bill.insuranceStatus = req.body.insuranceStatus;
    if (req.file) bill.invoiceUrl = publicUrl(req.file);

    await bill.save();
    res.json(bill);
  } catch (error) {
    next(error);
  }
};
