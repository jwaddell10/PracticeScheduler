import Purchases from "react-native-purchases";

export const getCustomerInfo = async () => {
	try {
        const customerInfo = await Purchases.getCustomerInfo();
        console.log("Customer info rev cat:", customerInfo);
        	return customerInfo;
    } catch (error) {
        console.log("Error getting customer info:", error);
    }
}