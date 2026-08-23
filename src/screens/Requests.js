import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { DATES, PRIORITIES, TIMES } from "../data";
import { ChoiceRow, NotFound, PrimaryButton, ReviewBlock, SecondaryButton } from "../ui";
import styles from "../styles";

export function RequestsScreen({ nav, params, app }) {
  const [filter, setFilter] = useState("Active");
  const visibleRequests = app.requests.filter((request) => (filter === "All" ? true : request.status === filter));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Requests</Text>
      <Text style={styles.h1}>Track and adjust</Text>
      <ChoiceRow options={["Active", "Completed", "Canceled", "All"]} value={filter} onChange={setFilter} testPrefix="request-filter" />
      {visibleRequests.map((request) => (
        <Pressable
          key={request.id}
          testID={`request-${request.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Open request ${request.id}`}
          onPress={() => nav.push("RequestDetail", { requestId: request.id })}
          style={styles.requestCard}
        >
          <View>
            <Text style={styles.cardEyebrow}>{request.id}</Text>
            <Text style={styles.cardTitle}>{request.title}</Text>
            <Text style={styles.cardBody}>{request.date} at {request.time}</Text>
          </View>
          <Text style={[styles.status, request.status === "Canceled" && styles.statusCanceled]}>{request.status}</Text>
        </Pressable>
      ))}
      {visibleRequests.length === 0 && <Text style={styles.emptyText}>No requests match this filter.</Text>}
    </ScrollView>
  );
}

export function RequestDetailScreen({ nav, params, app }) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const request = app.requests.find((item) => item.id === params.requestId);

  if (!request) {
    return <NotFound label="Request" nav={nav} />;
  }

  const editable = request.status === "Active";
  const saved = params.saved;

  const cancelRequest = (requestId) => {
    app.setRequests((current) =>
      current.map((item) =>
        item.id === requestId ? { ...item, status: "Canceled", timeline: [...item.timeline, "Canceled"] } : item
      )
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {saved && <Text style={styles.savedNotice}>Changes saved.</Text>}
      <Text style={styles.kicker}>{request.id}</Text>
      <Text style={styles.h1}>{request.title}</Text>
      <ReviewBlock rows={[
        ["Status", request.status],
        ["Date", request.date],
        ["Time", request.time],
        ["Address", request.address],
        ["Priority", request.priority],
        ["Notes", request.notes]
      ]} />
      <Text style={styles.sectionTitle}>Timeline</Text>
      {request.timeline.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.timelineRow}>
          <View style={styles.timelineDot} />
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
      {editable && (
        <>
          <PrimaryButton label="Edit request" testID="edit-request" onPress={() => nav.push("EditRequest", { request })} />
          <SecondaryButton label="Cancel request" testID="cancel-request" onPress={() => setConfirmingCancel(true)} danger />
        </>
      )}
      <Modal visible={confirmingCancel} animationType="fade" transparent>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.h2}>Cancel request?</Text>
            <Text style={styles.bodyText}>This moves {request.id} to canceled and adds it to the request timeline.</Text>
            <PrimaryButton
              label="Yes, cancel"
              testID="confirm-cancel-request"
              onPress={() => {
                cancelRequest(request.id);
                setConfirmingCancel(false);
              }}
            />
            <SecondaryButton label="Keep request" testID="dismiss-cancel-request" onPress={() => setConfirmingCancel(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export function EditRequestScreen({ nav, params, app }) {
  const { request } = params;
  const [date, setDate] = useState(request?.date);
  const [time, setTime] = useState(request?.time);
  const [priority, setPriority] = useState(request?.priority);
  const [notes, setNotes] = useState(request?.notes);

  if (!request) {
    return <NotFound label="Request" nav={nav} />;
  }

  const updatedRequest = { ...request, date, time, priority, notes };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Edit request</Text>
      <Text style={styles.h1}>{request.id}</Text>
      <Text style={styles.label}>Date</Text>
      <ChoiceRow options={DATES} value={date} onChange={setDate} testPrefix="edit-date" />
      <Text style={styles.label}>Time</Text>
      <ChoiceRow options={TIMES} value={time} onChange={setTime} testPrefix="edit-time" />
      <Text style={styles.label}>Priority</Text>
      <ChoiceRow options={PRIORITIES} value={priority} onChange={setPriority} testPrefix="edit-priority" />
      <Text style={styles.label}>Notes</Text>
      <TextInput
        testID="edit-request-notes"
        accessibilityLabel="Edit request notes"
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <PrimaryButton
        label="Review changes"
        testID="review-request-changes"
        onPress={() => nav.push("EditRequestReview", { request: updatedRequest })}
      />
    </ScrollView>
  );
}

export function EditRequestReviewScreen({ nav, params, app }) {
  const { request } = params;

  const updateRequest = (updated) => {
    app.setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    nav.replace("RequestDetail", { requestId: updated.id, saved: true });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.kicker}>Review changes</Text>
      <Text style={styles.h1}>{request.id}</Text>
      <ReviewBlock rows={[
        ["Date", request.date],
        ["Time", request.time],
        ["Priority", request.priority],
        ["Notes", request.notes]
      ]} />
      <PrimaryButton
        label="Save changes"
        testID="save-request-changes"
        onPress={() => updateRequest({ ...request, timeline: [...request.timeline, "Updated"] })}
      />
      <SecondaryButton
        label="Edit details"
        testID="edit-request-details"
        onPress={() => nav.replace("EditRequest", { request })}
      />
    </ScrollView>
  );
}
