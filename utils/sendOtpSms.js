import axios from "axios";

const SMS_CONFIG = {
    apiId: "APIvE2tGxUn147979",
    apiPassword: "uIbEUcnj",
    sender: "ICMPRT",
};

export const sendOtpSms = async (mobile, otp) => {
    try {
        if (!mobile) {
            throw new Error("Mobile number is required");
        }

        const message = `Your OTP for Indian Coffee Mart login is {#var#}. Please do not share this OTP with anyone for security reasons. This OTP is valid for 10 minutes. -ICMPRT`;

        const url = "https://bulksmsplans.com/api/verify";

        const response = await axios.get(url, {
            params: {
                api_id: SMS_CONFIG.apiId,
                api_password: SMS_CONFIG.apiPassword,
                sms_type: "Transactional",
                sms_encoding: "text",
                sender: SMS_CONFIG.sender,
                number: mobile,
                message: message,
                var1: otp || "1245",
            },
            timeout: 10000,
        });

        return response.data;
    } catch (error) {
        console.error(
            "SMS sending failed:",
            error?.response?.data || error.message
        );
        throw new Error("Failed to send OTP SMS");
    }
};
