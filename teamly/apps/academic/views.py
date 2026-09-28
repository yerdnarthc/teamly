from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .models import AcademicTerm, Subject

# Academic slice: owns the subjects/terms screen and catalog data.


@login_required
def academic_view(request):
    subjects = Subject.objects.filter(user=request.user).select_related("term")
    terms = AcademicTerm.objects.filter(subjects__user=request.user).distinct()
    return render(
        request,
        "academic/academic.html",
        {"subjects": subjects, "terms": terms},
    )
