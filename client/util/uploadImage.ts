    const uploadImageAsync = async (uri: string): Promise<string> => {
        try {
            if (!session?.user) {
                throw new Error("Unable to get authenticated user.");
            }

            const userId = session.user.id;
            const fileName = `${Date.now()}_${uri.substring(
                uri.lastIndexOf("/") + 1
            )}`;
            const filePath = `${userId}/${fileName}`;

            // Read file as base64 string (without "data:image/..." prefix)
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Decode base64 string to ArrayBuffer
            const arrayBuffer = decode(base64);

            // Upload to Supabase Storage as ArrayBuffer
            const { data, error } = await supabase.storage
                .from("drill-images")
                .upload(filePath, arrayBuffer, {
                    contentType: "image/jpeg", // adjust if you want dynamic contentType
                });
            if (error) {
                console.error("Upload error here:", error.message);
                throw error;
            }

            // Get public URL
            const { data: publicData } = supabase.storage
                .from("drill-images")
                .getPublicUrl(filePath);

            return publicData.publicUrl;
        } catch (err) {
            console.error("Upload failed:", err);
            throw err;
        }
    };