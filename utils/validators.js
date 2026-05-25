const validateRequiredFields = (fields) => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return `${key} is required`;
    }
  }
  return null;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Enter valid email.";
  return null;
};

const validateMobile = (mobile) => {
  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(mobile)) return "Enter a valid 10 digit mobile no.";
  return null;
};

const validatePAN = (pancard_no) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(pancard_no)) return "Enter a valid 10 digit PAN card no.";
  return null;
};

const validateGST = (gst_no) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(gst_no)) return "Enter a valid GST number.";
  return null;
};

const validateFutureDate = (date) => {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime()))
    return "Enter a valid date in YYYY-MM-DD format.";
  if (parsedDate <= new Date()) return "Last date should be a future date.";
  return null;
};

const validateQuantity = (quantity) => {
  if (!Number.isInteger(quantity)) return "Enter valid quantity.";
  if (quantity <= 0) return "Enter valid quantity.";
  return null;
};

const validatePriceRange = (minimum_price, maximum_price) => {
    if (parseFloat(minimum_price) <= 0)
        return "Minimum price must be a positive number."
    if (parseFloat(maximum_price) <= 0)
        return "Maximum price must be a positive number."
    if (parseFloat(minimum_price) >= parseFloat(maximum_price))
        return "Minimum price should be less than maximum price."
    return null
};

module.exports = {
  validateRequiredFields,
  validateEmail,
  validateMobile,
  validatePAN,
  validateGST,
  validateFutureDate,
  validateQuantity,
  validatePriceRange,
};
