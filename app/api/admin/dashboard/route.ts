import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import { getISTDateString } from '@/utils/time';

export async function GET() {
  try {
    await dbConnect();
    const dateString = getISTDateString();

    const allStudents = await User.find({ role: 'student' }).lean();
    const total = allStudents.length;
    
    const attendances = await Attendance.find({ dateString }).lean();
    
    const goingCount = attendances.filter(a => a.status === 'going').length;
    const notGoingCount = attendances.filter(a => a.status === 'not_going').length;
    const pendingCount = total - (goingCount + notGoingCount);
    
    const collectedCount = attendances.filter(a => a.status === 'going' && a.collectedFood).length;
    const pendingCollectionCount = goingCount - collectedCount;

    const studentsWithStatus = allStudents.map(student => {
      const att = attendances.find(a => String(a.userId) === String(student._id));
      const risk = (student.missedMeals || 0) >= 3;
      return {
        id: student._id,
        name: student.name,
        status: att ? att.status : 'pending',
        collectedFood: att ? !!att.collectedFood : false,
        risk,
        missed: student.missedMeals || 0
      };
    });

    const wasteRiskStudents = studentsWithStatus.filter(s => s.risk);

    const stats = {
      total,
      attending: goingCount,
      collectedCount,
      pendingCollectionCount,
      predictedWasteSavedKg: parseFloat(((notGoingCount + pendingCount) * 0.4).toFixed(1)), // Mock approx 400g per meal saved
      moneySaved: (notGoingCount + pendingCount) * 50, // ₹50 per meal
      wasteReductionPct: total > 0 ? Math.round(((notGoingCount + pendingCount) / total) * 100) : 0
    };

    return NextResponse.json({ success: true, stats, students: studentsWithStatus, wasteRiskStudents });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
