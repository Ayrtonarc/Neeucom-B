const { GraphQLUpload } = require = ("graphql-upload")


module.exports = {
    Mutation: {
        singleUpload: async (_, {file}) => {
            const imageUrl = await readFile(file);
            const singlefile = new SingleFile({image: imageUrl});
            await singlefile.save();
            return {
                message: "Single file uploaded successfully!"
            }
        },
}
}