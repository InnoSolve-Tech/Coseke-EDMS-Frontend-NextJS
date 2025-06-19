import { FormRecord } from "@/lib/types/formRecords";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  field: {
    fontSize: 12,
    marginBottom: 5,
  },
});

export const RecordPDF = ({ record }: { record: FormRecord }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Form Record Details</Text>
        <Text style={styles.field}>ID: {record.id}</Text>
        <Text style={styles.field}>
          Created Date:{" "}
          {new Date(record.createdDate!.toString()).toLocaleString()}
        </Text>
        {Object.entries(record.formFieldValues).map(([key, value]) => (
          <Text key={key} style={styles.field}>
            {key}: {value.value}
          </Text>
        ))}
      </View>
    </Page>
  </Document>
);
