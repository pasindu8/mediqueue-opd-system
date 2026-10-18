import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  submitFeedback,
  fetchPatientFeedback,
  updateFeedback,
  deleteFeedback,
} from '../../services/feedbackService';

export default function HelpSupportScreen() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Component 3: Feedback & Review CRUD State
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('Doctor Consultation');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Feedback Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFeedbackId, setEditFeedbackId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const loadFeedback = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const patientId = await AsyncStorage.getItem('patientId');
      if (userId || patientId) {
        const res = await fetchPatientFeedback(userId, patientId);
        if (res.ok && Array.isArray(res.data?.feedback)) {
          setFeedbackList(res.data.feedback);
        }
      }
    } catch (e) {
      console.log('Error fetching feedback:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Create Feedback (C)
  const handleSubmitFeedback = async () => {
    if (!comment.trim()) {
      Alert.alert('Required', 'Please write your feedback comment before submitting.');
      return;
    }
    try {
      setIsSubmitting(true);
      const userId = await AsyncStorage.getItem('userId');
      const patientId = await AsyncStorage.getItem('patientId');
      const fullName = await AsyncStorage.getItem('fullName');

      const res = await submitFeedback({
        userId,
        patientId,
        patientName: fullName || 'Patient',
        category: feedbackCategory,
        rating,
        comment: comment.trim(),
      });

      if (res.ok) {
        Alert.alert('Thank You', 'Your OPD service feedback has been recorded in the hospital registry.');
        setFeedbackModalVisible(false);
        setComment('');
        setRating(5);
        loadFeedback();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to submit feedback.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to submit feedback at this time.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Feedback (U)
  const handleSaveEdit = async () => {
    if (!editComment.trim()) {
      Alert.alert('Required', 'Feedback comment cannot be empty.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await updateFeedback(editFeedbackId, editRating, editComment.trim());
      if (res.ok) {
        Alert.alert('Updated', 'Your feedback review has been updated.');
        setEditModalVisible(false);
        loadFeedback();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to update feedback.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to update feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Feedback (D)
  const handleDeleteFeedback = (item) => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to withdraw this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteFeedback(item._id);
              if (res.ok) {
                Alert.alert('Removed', 'Feedback review has been deleted.');
                loadFeedback();
              }
            } catch (e) {
              Alert.alert('Error', 'Unable to delete feedback.');
            }
          },
        },
      ]
    );
  };

  // Initiate phone calls
  const handleMakeCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call on this device.');
    });
  };

  // Send support email
  const handleSendEmail = () => {
    Linking.openURL('mailto:support@mediqueue.lk?subject=MediQueue Support Request').catch(() => {
      Alert.alert('Error', 'No email app found on device.');
    });
  };

  // FAQ questions and answers list
  const faqs = [
    {
      id: 1,
      question: 'How do I obtain an OPD queue token?',
      answer:
        'Tap "New Token" from the home dashboard, select your required clinic department (e.g., OPD, Dental), and your token number will be generated immediately.',
    },
    {
      id: 2,
      question: 'What should I do if I miss my token call?',
      answer:
        'If your number has been called and missed, your token will remain held for 10 minutes. Visit the clinic reception desk to be re-added to the current batch.',
    },
    {
      id: 3,
      question: 'Can I view the queue status while offline?',
      answer:
        'Yes. If your mobile internet drops, the app switches to offline cache mode and sends essential room movement alerts via SMS to your registered phone number.',
    },
    {
      id: 4,
      question: 'Where can I collect my pharmacy prescription?',
      answer:
        'Once your consultation is finished, check the Notification section. You will receive an alert specifying the exact Counter Number when medication is ready.',
    },
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency Assistance Notice */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <Ionicons name="warning" size={22} color="#DC2626" />
            <Text style={styles.emergencyTitle}>Medical Emergency?</Text>
          </View>
          <Text style={styles.emergencySubtitle}>
            If you or the patient are facing an immediate medical emergency, please dial the national ambulance line directly.
          </Text>
          <TouchableOpacity
            style={styles.emergencyCallBtn}
            onPress={() => handleMakeCall('1990')}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.emergencyBtnText}>Call 1990 Suwa Seriya</Text>
          </TouchableOpacity>
        </View>

        {/* Direct Contact Channels */}
        <Text style={styles.sectionHeading}>Contact Hospital Helpdesk</Text>
        <View style={styles.contactGrid}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleMakeCall('0112345678')}
            activeOpacity={0.75}
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="headset-outline" size={22} color="#0D9488" />
            </View>
            <Text style={styles.contactCardTitle}>OPD Helpline</Text>
            <Text style={styles.contactCardSub}>Direct Line (24/7)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleSendEmail}
            activeOpacity={0.75}
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="mail-outline" size={22} color="#0D9488" />
            </View>
            <Text style={styles.contactCardTitle}>Email Support</Text>
            <Text style={styles.contactCardSub}>Response in 24h</Text>
          </TouchableOpacity>
        </View>

        {/* Physical Helpdesk Location */}
        <View style={styles.locationCard}>
          <Ionicons name="location-outline" size={20} color="#0F3A5D" />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>Physical Help Desk</Text>
            <Text style={styles.locationSub}>
              Counter 01, Ground Floor Main OPD Lobby, General Hospital.
            </Text>
          </View>
        </View>

        {/* FAQs Accordion */}
        <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {faqs.map((faq) => {
            const isOpen = expandedFaq === faq.id;
            return (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => toggleFaq(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ================= COMPONENT 3: PATIENT FEEDBACK & REVIEWS FULL CRUD ================= */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionHeading}>OPD Feedback & Quality Reviews</Text>
            <TouchableOpacity
              style={styles.addFeedbackBtn}
              onPress={() => setFeedbackModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addFeedbackBtnText}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {feedbackList.length === 0 ? (
            <View style={styles.emptyFeedbackCard}>
              <Ionicons name="chatbubbles-outline" size={28} color="#94A3B8" />
              <Text style={styles.emptyFeedbackText}>No feedback submitted yet.</Text>
              <Text style={styles.emptyFeedbackSub}>Share your OPD experience to help improve public hospital care.</Text>
            </View>
          ) : (
            feedbackList.map((item) => (
              <View key={item._id} style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= item.rating ? 'star' : 'star-outline'}
                        size={15}
                        color="#F59E0B"
                        style={{ marginRight: 2 }}
                      />
                    ))}
                    <Text style={styles.feedbackRatingText}>({item.rating}.0)</Text>
                  </View>
                  <View style={styles.feedbackCategoryBadge}>
                    <Text style={styles.feedbackCategoryText}>{item.category}</Text>
                  </View>
                </View>

                <Text style={styles.feedbackCommentText}>"{item.comment}"</Text>

                <View style={styles.feedbackFooter}>
                  <Text style={styles.feedbackDateText}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'Recent'} • {item.hospitalName}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditFeedbackId(item._id);
                        setEditRating(item.rating || 5);
                        setEditComment(item.comment || '');
                        setEditModalVisible(true);
                      }}
                    >
                      <Ionicons name="pencil" size={16} color="#0D9488" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteFeedback(item)}>
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Modal 1: Create Feedback */}
        <Modal visible={feedbackModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Submit OPD Visit Feedback</Text>
                <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Service Category</Text>
              <View style={styles.chipRow}>
                {['Doctor Consultation', 'Queue Waiting Time', 'Pharmacy Dispensary', 'Laboratory Services'].map(
                  (cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, feedbackCategory === cat && styles.categoryChipActive]}
                      onPress={() => setFeedbackCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          feedbackCategory === cat && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.modalLabel}>Rating (1 - 5 Stars)</Text>
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ padding: 4 }}>
                    <Ionicons
                      name={s <= rating ? 'star' : 'star-outline'}
                      size={28}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Your Comments / Suggestions</Text>
              <TextInput
                style={styles.commentInput}
                multiline
                numberOfLines={4}
                placeholder="Describe your consultation, wait time, or clinic experience..."
                placeholderTextColor="#94A3B8"
                value={comment}
                onChangeText={setComment}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitFeedback}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit Quality Feedback</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal 2: Edit Feedback */}
        <Modal visible={editModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Your Review</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Rating</Text>
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setEditRating(s)} style={{ padding: 4 }}>
                    <Ionicons
                      name={s <= editRating ? 'star' : 'star-outline'}
                      size={28}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Updated Comments</Text>
              <TextInput
                style={styles.commentInput}
                multiline
                numberOfLines={4}
                value={editComment}
                onChangeText={setEditComment}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveEdit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF5FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  emergencySubtitle: {
    fontSize: 12.5,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 12,
  },
  emergencyCallBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactCardSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 22,
  },
  locationTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  locationSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  faqQuestionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    paddingRight: 10,
  },
  faqAnswerContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  faqAnswerText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 6,
  },
  addFeedbackBtn: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addFeedbackBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyFeedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyFeedbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  emptyFeedbackSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 6,
  },
  feedbackCategoryBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  feedbackCategoryText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  feedbackCommentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  feedbackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  feedbackDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0D9488',
  },
  categoryChipText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  starPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    height: 90,
  },
  modalSubmitBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});