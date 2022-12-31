import ui, console
import datetime, shelve
from math import ceil, floor

def splitBill(date):
    def round(x): return int(ceil(x) if x - int(x) > 0.5 else floor(x))

    with shelve.open('database') as db:
        total = {name: sum(x[0] for x in info if x[1] == date) for name, info in db.items()}
        average = round(sum(total.values()) / len(total))
        delta = {name: cost - average for name, cost in total.items()}
        log = list()
        
        payerList = sorted(total.keys(), key=lambda x: delta[x])
        for payer in payerList:
            if delta[payer] >= 0: continue
            receivers = sorted(
                [name for name, _ in delta.items() if name != payer],
                key=lambda x: delta[x],
                reverse=True)
            for receiver in receivers:
                if delta[receiver] <= 0: continue
                shift = min(delta[receiver], abs(delta[payer]))
                delta[receiver] -= shift
                delta[payer] += shift
                log.append(f'{payer} -> {receiver} : {shift}')
                if delta[payer] >= 0: break

        msg = '\n'.join([f'{name} paid {cost} in total' for name, cost in total.items()])
        msg += f'\n\n{sum(total.values())} in total, {average} per capita\n\n'
        msg += '\n'.join(log)
        console.alert(title=f'Result of {date}', message=msg)

class PresentSection(object):

    def __init__(self, frame, controller):
        self.controller = controller
        self.mainView = ui.View(frame=frame, flex='LR')
    
    def constructContent(self, frame, name, cost, date, msg=None):
        view = ui.View(frame=frame, flex='LR')
        view.add_subview(ui.Button(
            frame=(0, 0, 50, 30),
            name=f'{name}',
            title=name,
            action=self.contentAction,
            tint_color='black'))
        view.add_subview(ui.Label(
            frame=(60, 0, 240, 30),
            name='info',
            text=f'{str(cost)}, {date}{", " if msg else ""}{msg}'))
        return view
    
    def contentAction(self, sender):
        self.controller.update(type(self).__name__, sender.name)
    
    def update(self):
        for subview in self.mainView.subviews:
            self.mainView.remove_subview(subview)
            del subview
        y = 0
        with shelve.open('database') as db:
            if len(db.keys()):
                for name, lst in db.items():
                    for (cost, date, msg) in lst:
                        self.mainView.add_subview(self.constructContent(
                            (10, y, 290, 30), name, cost, date, msg))
                        y += 32
            else:
                self.mainView.add_subview(ui.Label(
                    frame=(0, 0, 300, 30),
                    text='currently no data yet',
                    alignment=ui.ALIGN_CENTER))
                y += 32
        self.mainView.height = y
        return self.mainView.y + y + 5

class EditSection(object):

    def __init__(self, frame, controller):
        self.controller = controller

        self.mainView = ui.View(frame=frame, flex='LR')
        self.mainView.add_subview(ui.TextField(
            name='name',
            frame=(5, 0, 160, 30),
            placeholder='name',
            autocapitalization_type=ui.AUTOCAPITALIZE_NONE,
            clear_button_mode='while_editing'))
        self.mainView.add_subview(ui.TextField(
            frame=(175, 0, 90, 30),
            name='cost',
            placeholder='cost',
            keyboard_type=ui.KEYBOARD_NUMBER_PAD))
        self.mainView.add_subview(ui.Button(
            frame=(273, 3, 24, 24),
            name='submit',
            action=self.submitAction,
            background_image=ui.Image.named('iob:checkmark_circled_256')))

    def submitAction(self, sender):
        name, *msg = sender.superview['name'].text.split('-')
        msg = ', '.join(msg)
        cost = sender.superview['cost'].text
        date = str(datetime.date.today())
        if not (name and cost): return

        with shelve.open('database') as db:
            db.setdefault(name, [])
            db[name] += [(int(cost), date, msg)]
        self.controller.update(type(self).__name__)
        sender.superview['name'].text = ''
        sender.superview['cost'].text = ''
        sender.superview['name'].end_editing()
        sender.superview['cost'].end_editing()
    
    def update(self, name=None, y=None):
        if name:
            self.mainView['name'].text = name
        if y:
            self.mainView.y = y

class CodeSection(object):

    def __init__(self, frame, controller):
        self.controller = controller

        self.mainView = ui.View(frame=frame, flex='LR')
        self.mainView.add_subview(ui.TextField(
            frame=(5, 0, 230, 30),
            name='code',
            placeholder='code: use database as db',
            autocapitalization_type=ui.AUTOCAPITALIZE_NONE,
            clear_button_mode='while_editing'))
        self.mainView.add_subview(ui.Button(
            frame=(238, 3, 24, 24),
            name='snippet',
            action=self.snippetAction,
            background_image=ui.Image.named('iob:clipboard_256')))
        self.mainView.add_subview(ui.Button(
            frame=(273, 3, 24, 24),
            name='submit',
            action=self.submitAction,
            background_image=ui.Image.named('iob:play_256')))
    
    def snippetAction(self, sender):
        selected = console.alert(
            title='Snippets',
            button1='execute with given date',
            button2='add an entry with given date',
            button3='delete by name (+ index)')
        try:
            if selected == 1:
                date = console.input_alert(title='Assgin a date', message='Format: YYYY-MM-DD')
                code = f"splitBill('{date}')"
            elif selected == 2:
                name, cost, date, *msg = console.input_alert(title='Specify the infos', message='Format: name cost YYYY-MM-DD (memo)').split()
                msg = ','.join(msg)
                code = f"db.setdefault('{name}', []);db['{name}'].append(({cost}, '{date}', '{msg}'))"
            elif selected == 3:
                name, idx = console.input_alert(title='Assign a name and optional indices', message='Format: name index').split()
                if idx:
                    code = f"del db['{name}'][{idx}]"
                else:
                    code = f"del db['{name}']"
            else:
                code = ''
        except KeyboardInterrupt:
            code = ''
        sender.superview['code'].text = code
        sender.superview['code'].end_editing()
    
    def submitAction(self, sender):
        try:
            code = sender.superview['code'].text
            if 'db' in code:
                code = "with shelve.open('database', writeback=True) as db:\n\t" + code
            sender.superview['code'].text = ''
            sender.superview['code'].end_editing()
            exec(code)
            self.controller.update(type(self).__name__)
        except IndexError:
            print('exceptions in exec')
    
    def update(self, y=None):
        if y:
            self.mainView.y = y

class ViewController(object):

    def __init__(self):
        self.mainView = ui.ScrollView(
            frame=(0, 0, 320, 320),
            background_color='white')

        self.presentSection = PresentSection(frame=(10, 30, 300, 0), controller=self)
        self.editSection = EditSection(frame=(10, 0, 300, 30), controller=self)
        self.codeSection = CodeSection(frame=(10, 0, 300, 30), controller=self)

        self.mainView.add_subview(ui.Label(
            frame=(10, 5, 300, 20),
            flex='LR',
            text='Split the bill',
            font=('<system-bold>', 18),
            alignment=ui.ALIGN_CENTER))
        self.mainView.add_subview(self.presentSection.mainView)
        self.mainView.add_subview(self.editSection.mainView)
        self.mainView.add_subview(self.codeSection.mainView)
        self.mainView.right_button_items = [
            ui.ButtonItem(title='Exec', action=self.execAction),
            ui.ButtonItem(title='Reset', action=self.resetAction, tint_color='red')]

        self.update(type(self).__name__)
    
    def execAction(self, sender):
        splitBill(date=str(datetime.date.today()))
    
    def resetAction(self, sender):
        try:
            if console.alert(title='Reset all data', message='Are you sure to do so?', button1='Confirm'):
                with shelve.open('database') as db:
                    db.clear()
                self.update(type(self).__name__)
                console.alert('All data has been deleted!')
        except KeyboardInterrupt:
            pass
    
    def update(self, sender, *args):
        if sender == PresentSection.__name__:
            self.editSection.update(name=args[0])
        else:
            y = self.presentSection.update()
            self.editSection.update(y=y)
            self.codeSection.update(y=y + 35)
            _, height = ui.get_screen_size()
            self.mainView.content_size = (320, y + height / 2)

    def run(self):
        self.mainView.present('sheet')

if __name__ == '__main__':
    ViewController().run()
