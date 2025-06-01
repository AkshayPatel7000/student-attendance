import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Clock,
  LogOut,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  Trash,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppNameComponent from "./components/AppName";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { auth, db, provider } from "./config";

const AttendancePWA = () => {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [currentView, setCurrentView] = useState("subjects");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    credits: "",
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState({
    auth: false,
    subjects: false,
    attendance: {}, // Change this to an object to track individual days
    addSubject: false,
    deleteSubject: false,
    resetAttendance: false,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    type: null, // 'delete' or 'reset'
    message: "",
    onConfirm: null,
  });

  // Auth state listener and initial data loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          setLoading((prev) => ({ ...prev, subjects: true, attendance: true }));

          // Load subjects
          const subjectsQuery = query(
            collection(db, "subjects"),
            where("userId", "==", currentUser.uid)
          );
          const subjectsSnap = await getDocs(subjectsQuery);
          const subjectsData = subjectsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSubjects(subjectsData);

          // Load attendance data
          const attendanceQuery = query(
            collection(db, "attendance"),
            where("userId", "==", currentUser.uid)
          );
          const attendanceSnap = await getDocs(attendanceQuery);
          const attendanceMap = {};
          attendanceSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (!attendanceMap[data.subjectId]) {
              attendanceMap[data.subjectId] = {};
            }
            attendanceMap[data.subjectId][data.date] = data.status;
          });
          setAttendanceData(attendanceMap);
        } else {
          // Reset states when user is not logged in
          setUser(null);
          setSubjects([]);
          setAttendanceData({});
          setSelectedSubject(null);
          setCurrentView("subjects");
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading((prev) => ({
          ...prev,
          subjects: false,
          attendance: false,
        }));
        setInitialLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);
  // Save theme preference

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("darkMode", JSON.stringify(!isDarkMode));
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading((prev) => ({ ...prev, auth: true }));
      const result = await signInWithPopup(auth, provider);

      // Create user document if it doesn't exist
      const userDoc = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userDoc);

      if (!userSnap.exists()) {
        await setDoc(userDoc, {
          name: result.user.displayName,
          email: result.user.email,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading((prev) => ({ ...prev, auth: false }));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentView("subjects");
      setSubjects([]);
      setAttendanceData({});
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const addSubject = async (e) => {
    e.preventDefault(); // Prevent form submission
    if (!newSubject.name || !newSubject.code || !user) return;

    try {
      setLoading((prev) => ({ ...prev, addSubject: true }));
      const subjectRef = await addDoc(collection(db, "subjects"), {
        userId: user.uid,
        name: newSubject.name,
        code: newSubject.code,
        credits: parseInt(newSubject.credits) || 1,
        createdAt: new Date(),
      });

      const newSubjectData = {
        id: subjectRef.id,
        ...newSubject,
        credits: parseInt(newSubject.credits) || 1,
      };

      setSubjects([...subjects, newSubjectData]);
      setNewSubject({ name: "", code: "", credits: "" });
      setShowAddSubject(false);
    } catch (error) {
      console.error("Error adding subject:", error);
    } finally {
      setLoading((prev) => ({ ...prev, addSubject: false }));
    }
  };

  const markAttendance = async (date, status) => {
    if (!user || !selectedSubject) return;

    const dateKey = date.toISOString().split("T")[0];
    const attendanceRef = doc(
      db,
      "attendance",
      `${selectedSubject.id}_${dateKey}`
    );

    try {
      // Set loading state for specific date
      setLoading((prev) => ({
        ...prev,
        attendance: {
          ...prev.attendance,
          [dateKey]: true,
        },
      }));

      await setDoc(attendanceRef, {
        userId: user.uid,
        subjectId: selectedSubject.id,
        date: dateKey,
        status,
        updatedAt: new Date(),
      });

      setAttendanceData((prev) => ({
        ...prev,
        [selectedSubject.id]: {
          ...prev[selectedSubject.id],
          [dateKey]: status,
        },
      }));
    } catch (error) {
      console.error("Error marking attendance:", error);
    } finally {
      // Clear loading state for specific date
      setLoading((prev) => ({
        ...prev,
        attendance: {
          ...prev.attendance,
          [dateKey]: false,
        },
      }));
    }
  };

  const getAttendanceForDate = (date) => {
    if (!selectedSubject) return null;
    const dateKey = date.toISOString().split("T")[0];
    return attendanceData[selectedSubject.id]?.[dateKey] || null;
  };

  const calculateAttendanceStats = (subjectId) => {
    const subjectAttendance = attendanceData[subjectId] || {};
    const records = Object.values(subjectAttendance);
    const total = records.length;

    if (total === 0)
      return { percentage: 0, present: 0, absent: 0, halfPresent: 0 };

    const present = records.filter((r) => r === "present").length;
    const absent = records.filter((r) => r === "absent").length;
    const halfPresent = records.filter((r) => r === "half-present").length;
    const halfAbsent = records.filter((r) => r === "half-absent").length;

    const effectivePresent = present + halfPresent * 0.5 + halfAbsent * 0.5;
    const percentage = (effectivePresent / total) * 100;

    return {
      percentage: percentage.toFixed(1),
      present,
      absent,
      halfPresent: halfPresent + halfAbsent,
      total,
    };
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const AttendanceStatusIcon = ({ status }) => {
    switch (status) {
      case "present":
        return <Check className="w-4 h-4 text-green-600" />;
      case "absent":
        return <X className="w-4 h-4 text-red-600" />;
      case "half-present":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "half-absent":
        return <Minus className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  // Update the initial loading render
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`min-h-screen ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-900 to-gray-800"
            : "bg-gradient-to-br from-blue-50 to-indigo-100"
        } flex items-center justify-center p-4`}
      >
        <div
          className={`${
            isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          } rounded-2xl shadow-xl p-8 w-full max-w-md text-center`}
        >
          <div className="mb-8">
            <AppNameComponent isDarkMode={isDarkMode} size="large" />
            <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Track your class attendance with ease
            </p>
          </div>

          {/* Theme Toggle */}
          <div className="mb-6">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              } transition-colors`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading.auth}
            className={`w-full ${
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              loading.auth ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {loading.auth ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <User className="w-5 h-5" />
            )}
            {loading.auth ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>
      </div>
    );
  }

  // Custom Confirmation Dialog Component
  const ConfirmationDialog = ({ message, onConfirm, onCancel, type }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } rounded-xl p-6 w-full max-w-md`}
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle
            className={`w-6 h-6 ${
              type === "delete" ? "text-red-500" : "text-yellow-500"
            }`}
          />
          <h3
            className={`text-lg font-semibold ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            {type === "delete" ? "Confirm Delete" : "Confirm Reset"}
          </h3>
        </div>
        <p className={`mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 px-4 py-2 border rounded-lg ${
              isDarkMode
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-white ${
              type === "delete"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            }`}
          >
            {type === "delete" ? "Delete" : "Reset"}
          </button>
        </div>
      </div>
    </div>
  );

  const deleteSubject = async (subjectId) => {
    setConfirmDialog({
      show: true,
      type: "delete",
      message:
        "Are you sure you want to delete this subject? This action cannot be undone.",
      onConfirm: async () => {
        try {
          setLoading((prev) => ({ ...prev, deleteSubject: true }));

          // Delete subject document
          await deleteDoc(doc(db, "subjects", subjectId));

          // Delete all related attendance records
          const attendanceQuery = query(
            collection(db, "attendance"),
            where("subjectId", "==", subjectId)
          );
          const attendanceSnap = await getDocs(attendanceQuery);

          const batch = writeBatch(db);
          attendanceSnap.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();

          // Update local state
          setSubjects(subjects.filter((s) => s.id !== subjectId));
          const newAttendanceData = { ...attendanceData };
          delete newAttendanceData[subjectId];
          setAttendanceData(newAttendanceData);
          setCurrentView("subjects");
          setSelectedSubject(null);
        } catch (error) {
          console.error("Error deleting subject:", error);
          alert("Failed to delete subject. Please try again.");
        } finally {
          setLoading((prev) => ({ ...prev, deleteSubject: false }));
          setConfirmDialog({
            show: false,
            type: null,
            message: "",
            onConfirm: null,
          });
        }
      },
    });
  };

  const resetAttendance = async (subjectId) => {
    setConfirmDialog({
      show: true,
      type: "reset",
      message:
        "Are you sure you want to reset all attendance records for this subject? This action cannot be undone.",
      onConfirm: async () => {
        try {
          setLoading((prev) => ({ ...prev, resetAttendance: true }));

          // Delete all attendance records for this subject
          const attendanceQuery = query(
            collection(db, "attendance"),
            where("subjectId", "==", subjectId)
          );
          const attendanceSnap = await getDocs(attendanceQuery);

          const batch = writeBatch(db);
          attendanceSnap.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();

          // Update local state
          const newAttendanceData = { ...attendanceData };
          newAttendanceData[subjectId] = {};
          setAttendanceData(newAttendanceData);
        } catch (error) {
          console.error("Error resetting attendance:", error);
          alert("Failed to reset attendance. Please try again.");
        } finally {
          setLoading((prev) => ({ ...prev, resetAttendance: false }));
          setConfirmDialog({
            show: false,
            type: null,
            message: "",
            onConfirm: null,
          });
        }
      },
    });
  };

  // Update the header section to include the install button
  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <header
        className={`${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"
        } shadow-sm border-b`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <AppNameComponent isDarkMode={isDarkMode} size="small" />
            </div>
            <div className="flex items-center gap-4">
              <PWAInstallPrompt isDarkMode={isDarkMode} />
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                } transition-colors`}
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <span
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Hello, {user.displayName}
              </span>
              <button
                onClick={handleLogout}
                className={`${
                  isDarkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                } p-2 rounded-lg ${
                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "subjects" && (
          <div>
            {/* Subjects Header */}
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                My Subjects
              </h2>
              <button
                onClick={() => setShowAddSubject(true)}
                className={`${
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            </div>

            {/* Subjects Grid */}
            {loading.subjects ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => {
                  const stats = calculateAttendanceStats(subject.id);
                  return (
                    <div
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubject(subject);
                        setCurrentView("calendar");
                      }}
                      className={`${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                          : "bg-white"
                      } rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer p-6`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <BookOpen
                          className={`w-8 h-8 ${
                            isDarkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {subject.credits} Credits
                        </span>
                      </div>
                      <h3
                        className={`font-semibold text-lg ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        } mb-1`}
                      >
                        {subject.name}
                      </h3>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        } mb-4`}
                      >
                        {subject.code}
                      </p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span
                            className={`${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Attendance
                          </span>
                          <span
                            className={`font-semibold ${
                              stats.percentage >= 75
                                ? "text-green-500"
                                : stats.percentage >= 60
                                ? "text-yellow-500"
                                : "text-red-500"
                            }`}
                          >
                            {stats.percentage}%
                          </span>
                        </div>
                        <div
                          className={`w-full ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-200"
                          } rounded-full h-2`}
                        >
                          <div
                            className={`h-2 rounded-full transition-all ${
                              stats.percentage >= 75
                                ? "bg-green-500"
                                : stats.percentage >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(stats.percentage, 100)}%`,
                            }}
                          />
                        </div>
                        {stats.total > 0 && (
                          <div
                            className={`text-xs ${
                              isDarkMode ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            {stats.present}P • {stats.absent}A •{" "}
                            {stats.halfPresent}H of {stats.total} classes
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Subject Modal */}
            {showAddSubject && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div
                  className={`${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl p-6 w-full max-w-md`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Add New Subject
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Subject Name"
                      value={newSubject.name}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, name: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Subject Code"
                      value={newSubject.code}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, code: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300"
                      }`}
                    />
                    <input
                      type="number"
                      placeholder="Credits"
                      value={newSubject.credits}
                      onChange={(e) =>
                        setNewSubject({
                          ...newSubject,
                          credits: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowAddSubject(false)}
                      className={`flex-1 px-4 py-2 border rounded-lg ${
                        isDarkMode
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addSubject}
                      disabled={loading.addSubject}
                      className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 ${
                        loading.addSubject
                          ? "opacity-75 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {loading.addSubject ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : null}
                      {loading.addSubject ? "Adding..." : "Add Subject"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === "calendar" && selectedSubject && (
          <div>
            {/* Calendar Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              {/* Left Section - Subject Info */}
              <div className="flex flex-col w-full md:w-auto">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => setCurrentView("subjects")}
                    className={`p-2 rounded-lg ${
                      isDarkMode
                        ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                        : "text-blue-600 hover:text-blue-700 hover:bg-gray-100"
                    } transition-colors`}
                  >
                    ← Back
                  </button>
                </div>
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {selectedSubject.name}
                </h2>
              </div>

              {/* Right Section - Actions and Navigation */}
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => resetAttendance(selectedSubject.id)}
                    disabled={loading.resetAttendance}
                    className={`p-2 rounded-lg ${
                      isDarkMode
                        ? "text-yellow-500 hover:bg-gray-700"
                        : "text-yellow-600 hover:bg-yellow-50"
                    } transition-colors ${
                      loading.resetAttendance
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    title="Reset Attendance"
                  >
                    {loading.resetAttendance ? (
                      <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="sr-only">Reset Attendance</span>
                        <RotateCcw className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteSubject(selectedSubject.id)}
                    disabled={loading.deleteSubject}
                    className={`p-2 rounded-lg ${
                      isDarkMode
                        ? "text-red-500 hover:bg-gray-700"
                        : "text-red-600 hover:bg-red-50"
                    } transition-colors ${
                      loading.deleteSubject
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    title="Delete Subject"
                  >
                    {loading.deleteSubject ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="sr-only">Delete Subject</span>
                        <Trash className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Month Navigation */}
                <div
                  className={`flex items-center justify-end gap-2 p-1 rounded-lg ${
                    isDarkMode ? "bg-gray-800" : "bg-gray-100"
                  }`}
                >
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth() - 1
                        )
                      )
                    }
                    className={`p-2 rounded-lg ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-white"
                    } transition-colors`}
                    title="Previous Month"
                  >
                    ←
                  </button>
                  <span
                    className={`text-sm font-semibold px-3 ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth() + 1
                        )
                      )
                    }
                    className={`p-2 rounded-lg ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-white"
                    } transition-colors`}
                    title="Next Month"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Legend */}
            <div
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-xl p-4 mb-6 shadow-sm`}
            >
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Present
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-600" />
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Absent
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Half Present
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-orange-600" />
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                  >
                    Half Absent
                  </span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {getDaysInMonth(selectedDate).map((day, index) => (
                  <div key={index} className="bg-white min-h-[80px] p-2">
                    {day && (
                      <div className="h-full">
                        <div className="text-sm text-gray-600 mb-2">
                          {day.getDate()}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {[
                            "present",
                            "absent",
                            "half-present",
                            "half-absent",
                          ].map((status) => (
                            <button
                              key={status}
                              onClick={() => markAttendance(day, status)}
                              disabled={
                                loading.attendance[
                                  day.toISOString().split("T")[0]
                                ]
                              }
                              className={`p-1 rounded transition-colors ${
                                getAttendanceForDate(day) === status
                                  ? "bg-blue-100 ring-2 ring-blue-500"
                                  : "hover:bg-gray-100"
                              } ${
                                loading.attendance[
                                  day.toISOString().split("T")[0]
                                ]
                                  ? "opacity-75 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {loading.attendance[
                                day.toISOString().split("T")[0]
                              ] ? (
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <AttendanceStatusIcon status={status} />
                              )}
                            </button>
                          ))}
                        </div>
                        {getAttendanceForDate(day) && (
                          <div className="mt-1">
                            <AttendanceStatusIcon
                              status={getAttendanceForDate(day)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
              {(() => {
                const stats = calculateAttendanceStats(selectedSubject.id);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.present}
                      </div>
                      <div className="text-sm text-gray-600">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {stats.absent}
                      </div>
                      <div className="text-sm text-gray-600">Absent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.halfPresent}
                      </div>
                      <div className="text-sm text-gray-600">Half Days</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${
                          stats.percentage >= 75
                            ? "text-green-600"
                            : stats.percentage >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {stats.percentage}%
                      </div>
                      <div className="text-sm text-gray-600">Overall</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Add Confirmation Dialog */}
      {confirmDialog.show && (
        <ConfirmationDialog
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() =>
            setConfirmDialog({
              show: false,
              type: null,
              message: "",
              onConfirm: null,
            })
          }
        />
      )}
    </div>
  );
};

export default AttendancePWA;
