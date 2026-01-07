const Requirement = require("../Modal/Addrequirement");
const Category = require("../Modal/Category");
const Subcategory = require("../Modal/Subcategory");
const Subsubcategory = require("../Modal/Subsubcategory");
const WeightUnit = require("../Modal/Weightunit");

// 1) CREATE (Vendor creates => pending_admin, Inactive)
// exports.createProduct = async (req, res) => {
//     try {
//         const {
//             productTitle,
//             categoryId,
//             subcategoryId,
//             subsubcategoryId,
//             weightUnitId,
//             quantity,
//             pricePerUnit,
//             desc,
//             userId,
//         } = req.body;

//         const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : "";

//         const category = categoryId ? await Category.findById(categoryId) : null;
//         const subcategory = subcategoryId ? await Subcategory.findById(subcategoryId) : null;
//         const subsubcategory =
//             subsubcategoryId && String(subsubcategoryId).trim() !== ""
//                 ? await Subsubcategory.findById(subsubcategoryId)
//                 : null;

//         const weightUnit = weightUnitId ? await WeightUnit.findById(weightUnitId) : null;

//         const requirement = await Requirement.create({
//             productTitle,

//             categoryId,
//             categoryName: category?.Categoryname || "",

//             subcategoryId,
//             subcategoryName: subcategory?.subcategoryName || "",

//             subsubcategoryId: subsubcategory ? subsubcategoryId : undefined,
//             subsubcategoryName: subsubcategory?.subsubcategoryName || "",

//             weightUnitId,
//             weightUnitName: weightUnit?.weightUnitName || "",

//             quantity,
//             pricePerUnit,
//             desc,

//             userId,

//             productImage: imagePath,

//             approvalStatus: "pending_admin",
//         });

//         return res.status(201).json({ success: true, data: requirement });
//     } catch (err) {
//         console.error("createProduct error:", err);
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.createProduct = async (req, res) => {
//   try {
//     const {
//       productTitle,
//       categoryId,
//       subcategoryId,
//       subsubcategoryId,
//       weightUnitId,
//       quantity,
//       pricePerUnit,
//       desc,
//       userId,
//     } = req.body;

//     /* ========= BASIC VALIDATION ========= */
//     if (
//       !productTitle ||
//       !categoryId ||
//       !subcategoryId ||
//       !weightUnitId ||
//       !quantity ||
//       !pricePerUnit ||
//       !desc ||
//       !userId
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//     }

//     console.log("req.body",req.body)

//     /* ========= IMAGE HANDLING ========= */
//     let imagePath = "";
//     if (req.file) {
//       imagePath = req.file.path.replace(/\\/g, "/");
//     }

//     /* ========= FETCH NAMES ========= */
//     const category = await Category.findById(categoryId);
//     const subcategory = await Subcategory.findById(subcategoryId);
//     const weightUnit = await WeightUnit.findById(weightUnitId);

//     let subsubcategory = null;
//     if (subsubcategoryId && String(subsubcategoryId).trim() !== "") {
//       subsubcategory = await Subsubcategory.findById(subsubcategoryId);
//     }

//     /* ========= CREATE REQUIREMENT ========= */
//     const requirement = await Requirement.create({
//       productTitle,

//       categoryId,
//       categoryName: category?.Categoryname || "",

//       subcategoryId,
//       subcategoryName: subcategory?.subcategoryName || "",

//       subsubcategoryId: subsubcategory ? subsubcategoryId : undefined,
//       subsubcategoryName: subsubcategory?.subsubcategoryName || "",

//       weightUnitId,
//       weightUnitName: weightUnit?.weightUnitName || "",

//       quantity,
//       pricePerUnit,
//       desc,

//       userId,

//       productImage: imagePath, // "" if no image

//       approvalStatus: "pending_admin",
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Requirement created successfully",
//       data: requirement,
//     });
//   } catch (err) {
//     console.error("createProduct error:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Server error while creating requirement",
//     });
//   }
// };

exports.createProduct = async (req, res) => {
  try {
    const {
      productTitle,
      categoryId,
      subcategoryId,
      subsubcategoryId,
      weightUnitId,
      quantity,
      pricePerUnit,
      desc,
      userId,
    } = req.body;

    // Validation
    if (
      !productTitle ||
      !categoryId ||
      !subcategoryId ||
      !weightUnitId ||
      !quantity ||
      !pricePerUnit ||
      !desc ||
      !userId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Build image path (relative, public URL path)
    let productImage = "";
    if (req.file) {
      productImage = `/uploads/products/${req.file.filename}`;
    }

    // Fetch related names
    const [category, subcategory, weightUnit] = await Promise.all([
      Category.findById(categoryId),
      Subcategory.findById(subcategoryId),
      WeightUnit.findById(weightUnitId),
    ]);

    let subsubcategory = null;
    if (subsubcategoryId && String(subsubcategoryId).trim() !== "") {
      subsubcategory = await Subsubcategory.findById(subsubcategoryId);
    }

    // Create requirement
    const requirement = await Requirement.create({
      productTitle,
      categoryId,
      categoryName: category?.Categoryname || "",
      subcategoryId,
      subcategoryName: subcategory?.subcategoryName || "",
      subsubcategoryId: subsubcategory ? subsubcategoryId : undefined,
      subsubcategoryName: subsubcategory?.subsubcategoryName || "",
      weightUnitId,
      weightUnitName: weightUnit?.weightUnitName || "",
      quantity,
      pricePerUnit,
      desc,
      userId,
      productImage, // relative path like "/uploads/products/123.jpg"
      approvalStatus: "pending_admin",
    });

    return res.status(201).json({
      success: true,
      message: "Requirement created successfully",
      data: requirement,
    });
  } catch (err) {
    console.error("createProduct error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while creating requirement",
    });
  }
};
// 2) ADMIN APPROVE (pending_admin -> admin_approved)
exports.adminApproveProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const requirement = await Requirement.findById(id);
        if (!requirement) return res.status(404).json({ success: false, message: "Not found" });

        if (requirement.approvalStatus !== "pending_admin") {
            return res.status(400).json({
                success: false,
                message: `Cannot admin-approve from: ${requirement.approvalStatus}`,
            });
        }

        requirement.approvalStatus = "admin_approved";
        requirement.status = "Inactive";
        await requirement.save();

        return res.json({ success: true, message: "Admin approved. Now visible in Farmer app.", data: requirement });
    } catch (err) {
        console.error("adminApproveProduct error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 3) FARMER ACCEPT (admin_approved -> farmer_accepted) + push vendorData
exports.farmerAcceptProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { farmerId } = req.body;

        if (!farmerId) {
            return res.status(400).json({ success: false, message: "farmerId is required" });
        }

        const requirement = await Requirement.findById(id);
        if (!requirement) return res.status(404).json({ success: false, message: "Not found" });

        if (requirement.approvalStatus !== "admin_approved") {
            return res.status(400).json({
                success: false,
                message: `Farmer can accept only when admin_approved. Current: ${requirement.approvalStatus}`,
            });
        }

        // ✅ store like [{vendorId:"", refre:"farmer"}]
        requirement.vendorData = requirement.vendorData || [];
        requirement.vendorData.push({ vendorId: farmerId, refre: "farmer" });

        requirement.approvalStatus = "farmer_accepted";
        await requirement.save();

        return res.json({ success: true, message: "Farmer accepted. Waiting for final admin approval.", data: requirement });
    } catch (err) {
        console.error("farmerAcceptProduct error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 4) FINAL ADMIN APPROVE (farmer_accepted -> final_admin_approved) => Active
exports.finalAdminApproveProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const requirement = await Requirement.findById(id);
        if (!requirement) return res.status(404).json({ success: false, message: "Not found" });

        if (requirement.approvalStatus !== "farmer_accepted") {
            return res.status(400).json({
                success: false,
                message: `Final admin approve only after farmer_accepted. Current: ${requirement.approvalStatus}`,
            });
        }

        requirement.approvalStatus = "final_admin_approved";
        requirement.status = "Active";
        await requirement.save();

        return res.json({ success: true, message: "Final admin approved. Now Active.", data: requirement });
    } catch (err) {
        console.error("finalAdminApproveProduct error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// FARMER APP LIST (admin_approved)
exports.listForFarmerApp = async (req, res) => {
    try {
        const list = await Requirement.find({ approvalStatus: "admin_approved" }).sort({ createdAt: -1 });
        return res.json({ success: true, count: list.length, data: list });
    } catch (err) {
        console.error("listForFarmerApp error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ADMIN pending list
exports.listPendingAdmin = async (req, res) => {
    try {
        const list = await Requirement.find({ approvalStatus: "pending_admin" }).sort({ createdAt: -1 });
        return res.json({ success: true, count: list.length, data: list });
    } catch (err) {
        console.error("listPendingAdmin error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
