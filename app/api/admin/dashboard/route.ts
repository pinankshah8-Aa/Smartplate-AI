import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import { getISTDateString } from '@/utils/time';

export async function GET() {
  try {
    await dbConnect();
    const dateString = getISTDateString();

    const allStudents = await User.find({ role: 'student', isApproved: true }, '-passwordHash').lean();
    const pendingStudents = await User.find({ role: 'student', isApproved: false }, '-passwordHash').lean();
    
    // Separate active and inactive students
    const activeStudents = allStudents.filter(s => s.isActive !== false);
    const inactiveStudents = allStudents.filter(s => s.isActive === false);
    const total = activeStudents.length;
    
    const attendances = await Attendance.find({ dateString }).lean();
    
    // Calculate global stats using only ACTIVE students
    const activeGoing = attendances.filter(a => a.status === 'going' && activeStudents.some(s => String(s._id) === String(a.userId)));
    const activeNotGoing = attendances.filter(a => a.status === 'not_going' && activeStudents.some(s => String(s._id) === String(a.userId)));
    
    const goingCount = activeGoing.length;
    const notGoingCount = activeNotGoing.length;
    const pendingCount = total - (goingCount + notGoingCount);
    
    const collectedCount = activeGoing.filter(a => a.collectedFood).length;
    const pendingCollectionCount = goingCount - collectedCount;

    // Calculate institution-wise stats
    const institutionStats: Record<string, any> = {};
    activeStudents.forEach(student => {
      const inst = student.institutionName || 'Not specified';
      if (!institutionStats[inst]) {
        institutionStats[inst] = { name: inst, total: 0, required: 0, collected: 0, pending: 0 };
      }
      institutionStats[inst].total += 1;
      
      const att = attendances.find(a => String(a.userId) === String(student._id));
      if (att && att.status === 'going') {
        institutionStats[inst].required += 1;
        if (att.collectedFood) {
          institutionStats[inst].collected += 1;
        } else {
          institutionStats[inst].pending += 1;
        }
      } else if (!att || att.status === 'pending') {
        // If they are pending attendance
      }
    });

    const studentsWithStatus = allStudents.map(student => {
      const att = attendances.find(a => String(a.userId) === String(student._id));
      const risk = (student.missedMeals || 0) >= 3;
      return {
        id: student._id,
        name: student.name,
        username: student.username,
        institutionName: student.institutionName || 'Not specified',
        isActive: student.isActive !== false,
        status: att ? att.status : 'pending',
        collectedFood: att ? !!att.collectedFood : false,
        risk,
        missed: student.missedMeals || 0
      };
    });

    const wasteRiskStudents = studentsWithStatus.filter(s => s.risk && s.isActive);

    const stats = {
      total,
      attending: goingCount,
      collectedCount,
      pendingCollectionCount,
      predictedWasteSavedKg: parseFloat(((notGoingCount + pendingCount) * 0.4).toFixed(1)), // Mock approx 400g per meal saved
      moneySaved: (notGoingCount + pendingCount) * 50, // ₹50 per meal
      wasteReductionPct: total > 0 ? Math.round(((notGoingCount + pendingCount) / total) * 100) : 0,
      institutions: Object.values(institutionStats)
    };

    return NextResponse.json({ success: true, stats, students: studentsWithStatus, wasteRiskStudents, pendingStudents });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
