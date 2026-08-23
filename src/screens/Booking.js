import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ADDRESSES, DATES, PRIORITIES, SERVICES, TIMES } from "../data";
import { ChoiceRow, Metric, NotFound, PrimaryButton, ReviewBlock, SecondaryButton } from "../ui";
import styles from "../styles";

export function HomeScreen({ nav, params, app }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Today</Text>
        <Text style={styles.h1}>What needs handling?</Text>
        <Text style={styles.bodyText}>Book common services, track active errands, and update details in one place.</Text>
      </View>
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.cardGrid}>
        {SERVICES.map((service) => (
          <Pressable
            key={service.id}
            testID={`service-${service.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Open ${service.title}`}
            onPress={() => nav.push("ServiceDetail", { serviceId: service.id })}
            style={styles.serviceCard}
          >
            <View style={[styles.colorRail, { backgroundColor: service.accent }]} />
            <Text style={styles.cardEyebrow}>{service.category}</Text>
            <Text style={styles.cardTitle}>{service.title}</Text>
            <Text style={styles.cardBody}>{service.short}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.pill}>{service.price}</Text>
              <Text style={styles.pill}>{service.eta}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View style={styles.inlinePanel}>
        <Text style={styles.panelTitle}>Agent task seed</Text>
        <Text style={styles.bodyText}>Try: book a plumber for tomorrow morning at the home address.</Text>
      </View>
    </ScrollView>
  );
}

export function ServiceDetailScreen({ nav, params, app }) {
  const service = SERVICES.find((item) => item.id === params.serviceId);
  if (!service) {
    return <NotFound label="Service" nav={nav} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={[styles.detailHeader, { borderColor: service.accent }]}>
        <Text style={styles.kicker}>{service.category}</Text>
        <Text style={styles.h1}>{service.title}</Text>
        <Text style={styles.bodyText}>{service.details}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Metric label="Starting at" value={service.price} />
        <Metric label="Typical time" value={service.eta} />
      </View>
      <Text style={styles.sectionTitle}>Included</Text>
      {["Arrival updates", "Editable booking notes", "No-charge cancellation before dispatch"].map((item) => (
        <View key={item} style={styles.listRow}>
          <Text style={styles.checkMark}>+</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
      <PrimaryButton
        label="Book this service"
        testID="book-service"
        onPress={() => nav.push("BookingForm", { serviceId: service.id })}
      />
    </ScrollView>
  );
}

export function BookingFormScreen({ nav, params, app }) {
  const { serviceId, draft: initialDraft } = params;
  const service = SERVICES.find((item) => item.id === serviceId);
  const [date, setDate] = useState(initialDraft?.date || "");
  const [time, setTime] = useState(initialDraft?.time || "");
  const [address, setAddress] = useState(initialDraft?.address || app.profile.primaryAddress);
  const [priority, setPriority] = useState(initialDraft?.priority || "Normal");
  const [notes, setNotes] = useState(initialDraft?.notes || "");

  if (!service) {
    return <NotFound label="Service" nav={nav} />;
  }

  const canContinue = date && time && address;
  const booking = { serviceId, date, time, address, priority, notes };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>New booking</Text>
      <Text style={styles.h1}>{service.title}</Text>
      <Text style={styles.label}>Date</Text>
      <ChoiceRow options={DATES} value={date} onChange={setDate} testPrefix="date" />
      <Text style={styles.label}>Time</Text>
      <ChoiceRow options={TIMES} value={time} onChange={setTime} testPrefix="time" />
      <Text style={styles.label}>Address</Text>
      <ChoiceRow options={ADDRESSES} value={address} onChange={setAddress} testPrefix="address" />
      <Text style={styles.label}>Priority</Text>
      <ChoiceRow options={PRIORITIES} value={priority} onChange={setPriority} testPrefix="priority" />
      <Text style={styles.label}>Notes</Text>
      <TextInput
        testID="booking-notes"
        accessibilityLabel="Booking notes"
        style={styles.input}
        placeholder="Add access details or special instructions"
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <PrimaryButton
        label="Review booking"
        testID="review-booking"
        disabled={!canContinue}
        onPress={() => nav.push("BookingReview", { booking })}
      />
    </ScrollView>
  );
}

export function BookingReviewScreen({ nav, params, app }) {
  const { booking } = params;
  const service = SERVICES.find((item) => item.id === booking.serviceId);

  const createRequest = () => {
    const request = {
      id: `REQ-${Math.floor(1100 + Math.random() * 800)}`,
      serviceId: booking.serviceId,
      title: service.title,
      status: "Active",
      date: booking.date,
      time: booking.time,
      address: booking.address,
      priority: booking.priority,
      notes: booking.notes || "No extra notes.",
      timeline: ["Booked"]
    };
    app.setRequests((current) => [request, ...current]);
    nav.push("BookingConfirmation", { request });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Review booking</Text>
      <Text style={styles.h1}>Confirm details</Text>
      <ReviewBlock rows={[
        ["Service", service.title],
        ["Date", booking.date],
        ["Time", booking.time],
        ["Address", booking.address],
        ["Priority", booking.priority],
        ["Notes", booking.notes || "No extra notes."]
      ]} />
      <PrimaryButton label="Submit booking" testID="submit-booking" onPress={createRequest} />
      <SecondaryButton
        label="Edit details"
        testID="edit-booking-details"
        onPress={() => nav.replace("BookingForm", { serviceId: booking.serviceId, draft: booking })}
      />
    </ScrollView>
  );
}

export function BookingConfirmationScreen({ nav, params, app }) {
  const { request } = params;
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.successPanel}>
        <Text style={styles.kicker}>Confirmed</Text>
        <Text style={styles.h1}>{request.id}</Text>
        <Text style={styles.bodyText}>{request.title} is scheduled for {request.date} at {request.time}.</Text>
      </View>
      <ReviewBlock rows={[
        ["Address", request.address],
        ["Priority", request.priority],
        ["Status", request.status]
      ]} />
      <PrimaryButton label="View request" testID="view-created-request" onPress={() => nav.push("RequestDetail", { requestId: request.id })} />
      <SecondaryButton label="Back to home" testID="booking-home" onPress={() => nav.root("Home")} />
    </ScrollView>
  );
}
