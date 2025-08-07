import { loadDocuments, splitDocuments } from "../document/documentLoader";
import { initializePinecone, addDocumentsToCollection, deleteCollection } from "../vectorstore/chromaStore";
export const ingestDocuments = async (forceReindex: boolean = false) => {
  try {
    console.log("Starting document ingestion process...");
    
    // Delete existing collection if force reindexing is requested
    if (forceReindex) {
      console.log("Force reindexing requested. Deleting existing collection...");
      await deleteCollection();
    }
    
    // Load documents from the data directory
    console.log("Loading documents...");
    const documents = await loadDocuments();
    
    if (documents.length === 0) {
      console.log("No documents found to ingest.");
      return;
    }
    
    // Split documents into chunks
    console.log("Splitting documents into chunks...");
    const splitDocs = await splitDocuments(documents);
    
    // Store documents in Pinecone
    console.log("Storing documents in Pinecone...");
    await initializePinecone();
    await addDocumentsToCollection(splitDocs);
    
    console.log(`Ingestion complete. Processed ${documents.length} documents into ${splitDocs.length} chunks.`);
    
    return {
      documentsCount: documents.length,
      chunksCount: splitDocs.length
    };
  } catch (error) {
    console.error("Error during document ingestion:", error);
    throw error;
  }
};
