import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { DOCS_PAGE_SIZE, DOCUMENTS, INVOICES } from "../data";
import { NotFound, PrimaryButton, ReviewBlock, SecondaryButton, ToggleRow } from "../ui";
import { cardValid } from "../validate";
import styles from "../styles";

// All conditionals in this file use ?: (never {value && ...}): seeded
// INV-2405 has amount: 0 and INV-2408 has status: "", and a falsy-and there
// renders a bare 0 / "" outside <Text>, which hard-crashes React Native.

function amountText(amount) {
  return amount === 0 ? "No charge" : `$${amount.toFixed(2)}`;
}

// 4th tab root. Owns invoices and documents; tapping an invoice starts the
// deepest chain in the app (Billing -> PaymentReview -> PaymentResult).
export function BillingScreen({ nav, params, app }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Billing</Text>
      <Text style={styles.h1}>Invoices and payments</Text>
      <Pressable
        testID="open-payment-methods"
        accessibilityRole="button"
        accessibilityLabel="Open payment methods"
        onPress={() => nav.push("PaymentMethods")}
        style={styles.settingRow}
      >
        <View>
          <Text style={styles.cardTitle}>Payment methods</Text>
          <Text style={styles.cardBody}>{`${app.paymentMethods.length} saved cards`}</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
      <Pressable
        testID="open-documents"
        accessibilityRole="button"
        accessibilityLabel="Open documents"
        onPress={() => nav.push("Documents")}
        style={styles.settingRow}
      >
        <View>
          <Text style={styles.cardTitle}>Documents</Text>
          <Text style={styles.cardBody}>Statements and tax receipts</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
      <Pressable
        testID="open-policies"
        accessibilityRole="button"
        accessibilityLabel="Insurance policies"
        onPress={() => nav.push("Policies")}
        style={styles.settingRow}
      >
        <View>
          <Text style={styles.cardTitle}>Insurance policies</Text>
          <Text style={styles.cardBody}>Coverage, renewals, and claims</Text>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Invoices</Text>
      {INVOICES.map((invoice) => (
        <Pressable
          key={invoice.id}
          testID={`billing-invoice-${invoice.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Open invoice ${invoice.id}`}
          onPress={() => nav.push("PaymentReview", { invoiceId: invoice.id })}
          style={styles.requestCard}
        >
          <View>
            <Text style={styles.cardEyebrow}>{invoice.id}</Text>
            <Text style={styles.cardTitle}>{invoice.label}</Text>
            <Text style={styles.cardBody}>{amountText(invoice.amount)}</Text>
          </View>
          {invoice.status ? <Text style={styles.status}>{invoice.status}</Text> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function PaymentMethodsScreen({ nav, params, app }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Billing</Text>
      <Text style={styles.h1}>Payment methods</Text>
      {app.paymentMethods.map((method) => (
        <View key={method.id} testID={`method-${method.id}`} style={styles.listRow}>
          <Text style={styles.reviewLabel}>{method.brand}</Text>
          <Text style={styles.listText}>{`Card ending ${method.last4} - ${method.name}, expires ${method.expiry}`}</Text>
        </View>
      ))}
      <PrimaryButton label="Add a card" testID="add-card" onPress={() => nav.push("AddCard")} />
    </ScrollView>
  );
}

// Trap: format validation, not non-emptiness. card-submit stays disabled
// until cardValid passes: 16 digits (separators ignored), MM/YY with month
// 01-12, exactly 3 CVV digits, non-blank name.
export function AddCardScreen({ nav, params, app }) {
  const [number, setNumber] = useState("");
  const [expiryValue, setExpiryValue] = useState("");
  const [cvvValue, setCvvValue] = useState("");
  const [name, setName] = useState("");
  const valid = cardValid({ number, expiry: expiryValue, cvv: cvvValue, name });

  const saveCard = () => {
    app.setPaymentMethods((current) => [
      ...current,
      {
        id: `pm-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: "Card",
        last4: number.replace(/\D/g, "").slice(-4),
        name: name.trim(),
        expiry: expiryValue.trim()
      }
    ]);
    nav.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Billing</Text>
      <Text style={styles.h1}>Add a card</Text>
      <Text style={styles.bodyText}>
        Save enables once every field is valid: a 16-digit number, MM/YY expiry, 3-digit CVV, and
        the name on the card.
      </Text>
      <Text style={styles.label}>Card number</Text>
      <TextInput
        testID="card-number"
        accessibilityLabel="Card number"
        style={styles.singleInput}
        keyboardType="number-pad"
        placeholder="1234 5678 9012 3456"
        value={number}
        onChangeText={setNumber}
      />
      <Text style={styles.label}>Expiry</Text>
      <TextInput
        testID="card-expiry"
        accessibilityLabel="Card expiry"
        style={styles.singleInput}
        keyboardType="numbers-and-punctuation"
        placeholder="MM/YY"
        value={expiryValue}
        onChangeText={setExpiryValue}
      />
      <Text style={styles.label}>CVV</Text>
      <TextInput
        testID="card-cvv"
        accessibilityLabel="Card security code"
        style={styles.singleInput}
        keyboardType="number-pad"
        placeholder="123"
        secureTextEntry
        value={cvvValue}
        onChangeText={setCvvValue}
      />
      <Text style={styles.label}>Name on card</Text>
      <TextInput
        testID="card-name"
        accessibilityLabel="Name on card"
        style={styles.singleInput}
        autoCapitalize="words"
        placeholder="Alex Morgan"
        value={name}
        onChangeText={setName}
      />
      <PrimaryButton label="Save card" testID="card-submit" disabled={!valid} onPress={saveCard} />
    </ScrollView>
  );
}

// Branch point: the simulate-decline Switch decides which of PaymentResult's
// two terminal states payment-pay produces.
export function PaymentReviewScreen({ nav, params, app }) {
  const [declined, setDeclined] = useState(false);
  const invoice = INVOICES.find((item) => item.id === params.invoiceId);

  if (!invoice) {
    return <NotFound label="Invoice" nav={nav} />;
  }

  const method = app.paymentMethods[0];
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Review payment</Text>
      <Text style={styles.h1}>{invoice.label}</Text>
      <Text testID="payment-amount" accessibilityLabel={`Amount ${amountText(invoice.amount)}`} style={styles.h2}>
        {amountText(invoice.amount)}
      </Text>
      <ReviewBlock
        rows={[
          ["Invoice", invoice.id],
          ["Status", invoice.status ? invoice.status : "Unbilled"],
          ["Pay with", method ? `${method.brand} ending ${method.last4}` : "No saved card"]
        ]}
      />
      <ToggleRow label="Simulate a declined payment" value={declined} onValueChange={setDeclined} testID="simulate-decline" />
      <PrimaryButton
        label="Pay now"
        testID="payment-pay"
        onPress={() => nav.push("PaymentResult", { invoiceId: invoice.id, declined })}
      />
    </ScrollView>
  );
}

// Two mutually exclusive terminal states on one route. payment-result is the
// always-present anchor - it renders unconditionally in both states.
export function PaymentResultScreen({ nav, params, app }) {
  const declined = !!params.declined;
  const invoice = INVOICES.find((item) => item.id === params.invoiceId);
  const label = invoice ? invoice.label : "this invoice";

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text testID="payment-result" style={styles.kicker}>
        Payment result
      </Text>
      {declined ? (
        <View testID="payment-declined" style={styles.inlinePanel}>
          <Text style={styles.h1}>Payment declined</Text>
          <Text style={styles.bodyText}>
            {`Your card was declined for ${label}. No charge was made - review the payment and try again.`}
          </Text>
        </View>
      ) : (
        <View testID="payment-success" style={styles.successPanel}>
          <Text style={styles.h1}>Payment complete</Text>
          <Text style={styles.bodyText}>{`Your payment for ${label} went through. A receipt is on its way.`}</Text>
        </View>
      )}
      {declined ? (
        <PrimaryButton
          label="Try again"
          testID="payment-retry"
          onPress={() => nav.replace("PaymentReview", { invoiceId: params.invoiceId })}
        />
      ) : (
        <PrimaryButton label="Back to billing" testID="payment-done" onPress={() => nav.root("Billing")} />
      )}
    </ScrollView>
  );
}

// Trap: load-more growth. The route stays the same while docs-load-more
// appends the next DOCS_PAGE_SIZE rows in place; the button unmounts once all
// 60 are shown (after exactly 5 taps), which is what makes the trap bounded.
// docs-count is the anchor: it renders unconditionally in every page state.
// Bounded at 60 items, so this stays a ScrollView + .map - no FlatList.
export function DocumentsScreen({ nav, params, app }) {
  const [page, setPage] = useState(1);
  const shown = DOCUMENTS.slice(0, page * DOCS_PAGE_SIZE);
  const exhausted = shown.length >= DOCUMENTS.length;
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Billing</Text>
      <Text style={styles.h1}>Documents</Text>
      <Text
        testID="docs-count"
        accessibilityLabel={`Showing ${shown.length} of ${DOCUMENTS.length} documents`}
        style={styles.bodyText}
      >
        {`${shown.length} of ${DOCUMENTS.length}`}
      </Text>
      {shown.map((doc) => (
        <Pressable
          key={doc.id}
          testID={`doc-${doc.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Open document ${doc.title}`}
          onPress={() => nav.push("DocumentDetail", { docId: doc.id })}
          style={styles.requestCard}
        >
          <View>
            <Text style={styles.cardEyebrow}>{doc.id}</Text>
            <Text style={styles.cardTitle}>{doc.title}</Text>
            <Text style={styles.cardBody}>{`${doc.kind} - ${doc.sizeKb} KB`}</Text>
          </View>
          <Text style={styles.chevron}>{">"}</Text>
        </Pressable>
      ))}
      {exhausted ? null : (
        <PrimaryButton
          label="Load more"
          testID="docs-load-more"
          onPress={() => setPage((current) => current + 1)}
        />
      )}
    </ScrollView>
  );
}

// Trap: param explosion. One route, 60 param instances via params.docId -
// the correct crawler model is 1 route / 60 instances, not 60 routes.
export function DocumentDetailScreen({ nav, params, app }) {
  const doc = DOCUMENTS.find((item) => item.id === params.docId);

  if (!doc) {
    return <NotFound label="Document" nav={nav} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Document</Text>
      <Text testID="doc-detail-title" accessibilityLabel={`Document ${doc.title}`} style={styles.h1}>
        {doc.title}
      </Text>
      <ReviewBlock
        rows={[
          ["Reference", doc.id],
          ["Kind", doc.kind],
          ["Year", String(doc.year)],
          ["Size", `${doc.sizeKb} KB`]
        ]}
      />
      <SecondaryButton label="Back to documents" testID="doc-detail-back" onPress={() => nav.back()} />
    </ScrollView>
  );
}
