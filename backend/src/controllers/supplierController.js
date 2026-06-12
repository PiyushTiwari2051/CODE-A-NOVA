const { Supplier, PurchaseOrder } = require('../models');

// Get All Suppliers
const getSuppliers = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const suppliers = await Supplier.find({ shop: shopId });

    // For each supplier, dynamically calculate total purchases value and outstanding balances
    const enriched = await Promise.all(
      suppliers.map(async (supplier) => {
        const purchaseOrders = await PurchaseOrder.find({
          supplier: supplier._id,
          shop: shopId
        });

        const totalPurchases = purchaseOrders
          .filter((po) => po.status === 'Received' || po.status === 'Partial')
          .reduce((acc, po) => acc + po.totalValue, 0);

        // Assume PO is pending payment if received but status/notes specify payment outstanding
        // For simplicity, sum total values of "Received" POs as a metric of total vendor interaction,
        // and calculate outstanding balance (e.g. Received POs that are unpaid - we can track via payments or mock it).
        // Let's assume POs marked "Received" or "Sent" have a portion unpaid unless flagged.
        // We'll calculate a mock outstanding balance based on paymentTerms or status
        const outstandingBalance = purchaseOrders
          .filter((po) => po.status === 'Sent' || po.status === 'Partial')
          .reduce((acc, po) => acc + po.totalValue, 0);

        return {
          ...supplier,
          totalPurchases,
          outstandingBalance
        };
      })
    );

    return res.status(200).json({ success: true, suppliers: enriched });
  } catch (error) {
    console.error('Get suppliers error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving suppliers list' });
  }
};

// Create Supplier
const createSupplier = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { companyName, contactPerson, email, phone, city, address, taxId, paymentTerms, notes, isActive } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    // Check if supplier already exists by companyName
    const exists = await Supplier.findOne({
      companyName: new RegExp(`^${companyName}$`, 'i'),
      shop: shopId
    });
    if (exists) {
      return res.status(400).json({ success: false, message: `Supplier company '${companyName}' already exists` });
    }

    const newSupplier = await Supplier.create({
      companyName,
      contactPerson: contactPerson || '',
      email: email || '',
      phone: phone || '',
      city: city || '',
      address: address || '',
      taxId: taxId || '',
      paymentTerms: paymentTerms || 'Net 30',
      notes: notes || '',
      isActive: isActive !== undefined ? isActive : true,
      shop: shopId
    });

    return res.status(201).json({ success: true, supplier: newSupplier });
  } catch (error) {
    console.error('Create supplier error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating supplier' });
  }
};

// Get Supplier details + Related POs
const getSupplierById = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const supplier = await Supplier.findOne({ _id: req.params.id, shop: shopId });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Fetch related Purchase Orders
    const purchaseOrders = await PurchaseOrder.find({
      supplier: supplier._id,
      shop: shopId
    });

    return res.status(200).json({
      success: true,
      supplier,
      purchaseOrders
    });
  } catch (error) {
    console.error('Get supplier by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching supplier details' });
  }
};

// Update Supplier
const updateSupplier = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { companyName, contactPerson, email, phone, city, address, taxId, paymentTerms, notes, isActive } = req.body;

    const supplier = await Supplier.findOne({ _id: req.params.id, shop: shopId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Check companyName duplicate if changing
    if (companyName && companyName !== supplier.companyName) {
      const exists = await Supplier.findOne({
        companyName: new RegExp(`^${companyName}$`, 'i'),
        shop: shopId
      });
      if (exists) {
        return res.status(400).json({ success: false, message: `Supplier company '${companyName}' already exists` });
      }
    }

    const updated = await Supplier.findByIdAndUpdate(supplier._id, {
      companyName: companyName || supplier.companyName,
      contactPerson: contactPerson !== undefined ? contactPerson : supplier.contactPerson,
      email: email !== undefined ? email : supplier.email,
      phone: phone !== undefined ? phone : supplier.phone,
      city: city !== undefined ? city : supplier.city,
      address: address !== undefined ? address : supplier.address,
      taxId: taxId !== undefined ? taxId : supplier.taxId,
      paymentTerms: paymentTerms || supplier.paymentTerms,
      notes: notes !== undefined ? notes : supplier.notes,
      isActive: isActive !== undefined ? isActive : supplier.isActive
    }, { new: true });

    return res.status(200).json({ success: true, supplier: updated });
  } catch (error) {
    console.error('Update supplier error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating supplier profile' });
  }
};

// Delete Supplier
const deleteSupplier = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const supplier = await Supplier.findOne({ _id: req.params.id, shop: shopId });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Check if supplier has any registered Purchase Orders
    const poCount = await PurchaseOrder.countDocuments({ supplier: supplier._id, shop: shopId });
    if (poCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier. There are ${poCount} Purchase Orders associated with this vendor.`
      });
    }

    await Supplier.findByIdAndDelete(supplier._id);
    return res.status(200).json({ success: true, message: `Supplier '${supplier.companyName}' successfully deleted` });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting supplier' });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  getSupplierById,
  updateSupplier,
  deleteSupplier
};
